"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const AI_MODELS = [
  { id: "chatgpt", name: "ChatGPT" },
  { id: "deepseek", name: "DeepSeek" },
  { id: "perplexity", name: "Perplexity AI" },
  { id: "claude", name: "Claude" },
  { id: "gemini", name: "Gemini" },
];

const DEFAULT_DOMAINS = [
  "Software Development",
  "Data Analysis",
  "Content Writing",
  "Academic Research",
  "Teaching",
  "Business Analysis",
  "Creative Writing",
  "Marketing",
];

export default function Home() {
  const [selectedModel, setSelectedModel] = useState("");
  const [domain, setDomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [promptRequest, setPromptRequest] = useState("");
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState("analyze");
  const [followUpResponses, setFollowUpResponses] = useState<string[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [currentUnderstanding, setCurrentUnderstanding] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState<{
    refinedPrompt: string;
    suggestedFollowUps: string[];
    explanation: string;
  } | null>(null);
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          domain: isCustomDomain ? customDomain : domain,
          request: promptRequest,
          stage: currentStage,
          previousResponses: followUpResponses,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate prompt');
      }

      const data = await response.json();
      console.log(data)
      
      if (data.stage === 'questions') {
        setCurrentStage('questions');
        setFollowUpQuestions(data.followUpQuestions);
        setAnalysis(data.analysis);
        setCurrentUnderstanding(data.currentUnderstanding);
      } else if (data.stage === 'complete') {
        setGeneratedPrompt(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpSubmit = (responses: string[]) => {
    setFollowUpResponses(responses);
    setCurrentStage('questions');
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary dark text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              AI Prompt Perfection
            </h1>
            <p className="text-lg text-muted-foreground">
              Create powerful, precise prompts for any AI model
            </p>
          </div>

          {/* Main Form */}
          <Card className="p-6 backdrop-blur-sm bg-card/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* AI Model Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select AI Model</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Domain Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Domain/Role</label>
                {!isCustomDomain ? (
                  <>
                    <Select value={domain} onValueChange={setDomain}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_DOMAINS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setIsCustomDomain(true)}
                      className="px-0"
                    >
                      Enter custom domain
                    </Button>
                  </>
                ) : (
                  <>
                    <Input
                      placeholder="Enter your domain"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setIsCustomDomain(false)}
                      className="px-0"
                    >
                      Choose from preset domains
                    </Button>
                  </>
                )}
              </div>

              {/* Prompt Request */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  What do you want to achieve?
                </label>
                <Textarea
                  placeholder="Describe your goal in detail..."
                  value={promptRequest}
                  onChange={(e) => setPromptRequest(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Analyzing..." : "Analyze Request"}
              </Button>
            </form>
          </Card>

          {/* Analysis and Follow-up Questions */}
          {currentStage === 'questions' && !generatedPrompt && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Initial Analysis</h3>
                  <p className="text-muted-foreground">{analysis}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Current Understanding</h3>
                  <p className="text-muted-foreground">{currentUnderstanding}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Information Needed</h3>
                  {followUpQuestions.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <p className="text-sm font-medium">{question}</p>
                      <Textarea
                        placeholder="Your response..."
                        value={followUpResponses[index] || ''}
                        onChange={(e) => {
                          const newResponses = [...followUpResponses];
                          newResponses[index] = e.target.value;
                          setFollowUpResponses(newResponses);
                        }}
                        className="resize-none"
                      />
                    </div>
                  ))}
                  <Button
                    onClick={() => handleFollowUpSubmit(followUpResponses)}
                    className="w-full"
                    disabled={followUpResponses.length !== followUpQuestions.length}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Generate Final Prompt
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Generated Prompt Result */}
          {generatedPrompt && (
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Generated Prompt</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="whitespace-pre-wrap">{generatedPrompt.refinedPrompt}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Suggested Follow-up Questions</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {generatedPrompt.suggestedFollowUps.map((question, index) => (
                      <li key={index} className="text-muted-foreground">{question}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Explanation</h3>
                  <p className="text-muted-foreground">{generatedPrompt.explanation}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <h3 className="font-semibold mb-2">AI Model Optimized</h3>
              <p className="text-sm text-muted-foreground">
                Tailored prompts for specific AI models' strengths
              </p>
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">Domain Expertise</h3>
              <p className="text-sm text-muted-foreground">
                Context-aware suggestions based on your field
              </p>
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">Smart Refinement</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered analysis for comprehensive prompts
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}