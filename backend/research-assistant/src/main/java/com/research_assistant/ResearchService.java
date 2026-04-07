package com.research_assistant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@Service
public class ResearchService {
    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public ResearchService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }


    public String processContent(ResearchRequest request) {
        try {
            // Build the prompt
            String prompt = buildPrompt(request);

            // Query the AI Model API
            Map<String, Object> requestBody = Map.of(
                    "contents", new Object[] {
                            Map.of("parts", new Object[]{
                                    Map.of("text", prompt)
                            })
                    }
            );

            String response = webClient.post()
                    .uri(geminiApiUrl + "?key=" + geminiApiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return extractTextFromResponse(response);
        } catch (IllegalArgumentException e) {
            return "Error: Unknown Operation - " + e.getMessage();
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException.TooManyRequests e) {
            return "Whoops! 🚦 Gemini API Rate limit exceeded (429 Too Many Requests). Please wait about a minute before trying again.";
        } catch (Exception e) {
            e.printStackTrace();
            return "Backend Server Error: " + e.getMessage();
        }
    }

    private String extractTextFromResponse(String response) {
        try{
            GeminiResponse geminiResponse =  objectMapper.readValue(response, GeminiResponse.class);
            if (geminiResponse.getCandidates() != null && !geminiResponse.getCandidates().isEmpty()) {
                GeminiResponse.Candidate firstCandidate = geminiResponse.getCandidates().get(0);
                if (firstCandidate.getContent() != null && firstCandidate.getContent().getParts() != null && !firstCandidate.getContent().getParts().isEmpty()) {
                    return firstCandidate.getContent().getParts().get(0).getText();
                }
            }
            return "No content found in response";
        } catch (Exception e) {
            return "Error Parsing: "+ e.getMessage();
        }
    }

    private String buildPrompt(ResearchRequest request) {
        StringBuilder prompt = new StringBuilder();
        switch (request.getOperation()){
            case "summarize":
                prompt.append("Provide a clear and concise summary of the following text in bullet points. Use short, easy-to-understand points:\n\n");
                break;
            case "suggest":
                prompt.append("Based on the following content: suggest related topics and further reading. Format the response with clear headings and bullet points:\n\n");
                break;
            case "translate":
                prompt.append("Translate the following text into ").append(request.getLanguage() != null ? request.getLanguage() : "English").append(". Provide ONLY the translated text and nothing else:\n\n");
                break;
            case "paraphrase":
                prompt.append("Rewrite and paraphrase the following text to make it clearer and more professional. Provide ONLY the rewritten text without any conversational filler:\n\n");
                break;
            case "quiz":
                prompt.append("Generate a short quiz (3 questions) based on the following text. Provide the output in a clear Question and Answer format. Provide ONLY the questions, followed by the answers. Do NOT include any conversational filler:\n\n");
                break;
            default:
                throw new IllegalArgumentException("Unknown operation: " + request.getOperation());
        }
        prompt.append(request.getContent());
        return prompt.toString();
    }
}
