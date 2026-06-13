package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"time"

	"github.com/stashlog/backend/config"
)

type GeminiService struct {
	cfg *config.Config
}

func NewGeminiService(cfg *config.Config) *GeminiService {
	return &GeminiService{cfg: cfg}
}

type geminiRequest struct {
	Contents []geminiContent `json:"contents"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func (s *GeminiService) GenerateDailySummary(rawLogs string) (string, bool) {
	if s.cfg.MockMode {
		return s.mockDailySummary(rawLogs), false
	}

	prompt := fmt.Sprintf(`You are a helpful assistant that formats developer work logs into clean, professional daily standup summaries. Format the following logs into three sections: What I did, Any blockers, Plan for tomorrow (infer if not mentioned). Keep it concise and professional. Logs: %s`, rawLogs)

	result, err := s.callGemini(prompt)
	if err != nil {
		log.Printf("Gemini daily summary failed, using fallback: %v", err)
		return s.fallbackDailySummary(rawLogs), true
	}

	return result, false
}

func (s *GeminiService) GenerateWeeklySummary(summaries string) (string, bool) {
	if s.cfg.MockMode {
		return s.mockWeeklySummary(summaries), false
	}

	prompt := fmt.Sprintf(`You are a helpful assistant. Summarize the following daily work summaries into a clean, readable weekly recap. Group by themes if possible (features built, bugs fixed, learnings, blockers resolved). Keep it motivating and professional. Summaries: %s`, summaries)

	result, err := s.callGemini(prompt)
	if err != nil {
		log.Printf("Gemini weekly summary failed, using fallback: %v", err)
		return s.fallbackWeeklySummary(summaries), true
	}

	return result, false
}

func (s *GeminiService) callGemini(prompt string) (string, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=%s", s.cfg.GeminiAPIKey)

	reqBody := geminiRequest{
		Contents: []geminiContent{
			{
				Parts: []geminiPart{
					{Text: prompt},
				},
			},
		},
	}

	var lastErr error
	for attempt := 0; attempt < 3; attempt++ {
		if attempt > 0 {
			backoff := time.Duration(math.Pow(2, float64(attempt))) * time.Second
			time.Sleep(backoff)
		}

		jsonBody, err := json.Marshal(reqBody)
		if err != nil {
			return "", err
		}

		resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonBody))
		if err != nil {
			lastErr = err
			continue
		}

		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()

		if err != nil {
			lastErr = err
			continue
		}

		if resp.StatusCode != http.StatusOK {
			lastErr = fmt.Errorf("gemini API returned status %d: %s", resp.StatusCode, string(body))
			continue
		}

		var geminiResp geminiResponse
		if err := json.Unmarshal(body, &geminiResp); err != nil {
			lastErr = err
			continue
		}

		if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
			return geminiResp.Candidates[0].Content.Parts[0].Text, nil
		}

		lastErr = fmt.Errorf("empty response from Gemini")
	}

	return "", fmt.Errorf("failed after 3 attempts: %v", lastErr)
}

func (s *GeminiService) mockDailySummary(rawLogs string) string {
	return fmt.Sprintf(`## What I Did
- Worked on various tasks as logged
- Made progress on current sprint items

## Blockers
- No major blockers reported

## Plan for Tomorrow
- Continue working on current tasks
- Review and address any pending items

---
*Generated from your daily logs*`)
}

func (s *GeminiService) mockWeeklySummary(summaries string) string {
	return fmt.Sprintf(`## Weekly Recap

### Features Built
- Continued development on sprint tasks

### Bugs Fixed
- Addressed issues as they arose

### Key Learnings
- Gained experience with current tech stack

### Looking Ahead
- Plan to build on this week's momentum

---
*Generated from your weekly summaries*`)
}

func (s *GeminiService) fallbackDailySummary(rawLogs string) string {
	return fmt.Sprintf("## Today's Work Log\n\n%s\n\n---\n*AI summary unavailable — showing raw logs*", rawLogs)
}

func (s *GeminiService) fallbackWeeklySummary(summaries string) string {
	return fmt.Sprintf("## Weekly Log Summary\n\n%s\n\n---\n*AI summary unavailable — showing raw summaries*", summaries)
}
