export interface GradingJobPayload {
  grading_job_id: number;
  submission_id: number;
  assignment_id: number;
  team_id?: number;
  artifact_url: string;
  git_commit_hash: string;
  code_content?: string;
  language?: 'python' | 'javascript' | 'nodejs';
  priority?: number;
}

export interface RubricRuleItem {
  rubric_rule_id: number;
  assignment_id: number;
  rule_type: 'AUTOMATED' | 'MANUAL' | 'AI_ANALYSIS';
  criterion: string;
  input_data?: string;
  expected_output?: string;
  weight: number;
  max_score: number;
  is_hidden: boolean;
}

export interface TestResultItem {
  rubric_rule_id: number;
  criterion: string;
  passed: boolean;
  score: number;
  max_score: number;
  actual_output: string;
  expected_output?: string;
  execution_time_ms: number;
  is_hidden: boolean;
  error?: string;
  ai_feedback?: string;
}

export interface GradingJobSummary {
  grading_job_id: number;
  submission_id: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  total_score: number;
  max_possible_score: number;
  passed_rules_count: number;
  total_rules_count: number;
  results: TestResultItem[];
  completed_at?: Date;
}
