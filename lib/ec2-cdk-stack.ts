import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { GitHubTrigger } from "aws-cdk-lib/aws-codepipeline-actions";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { SetupResourceStage } from "./pipeline-stages";

export class PythonEc2BlogpostStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "Pipeline12223", {
      pipelineName: `docai-Pipeline`,
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub(String(process.env.REPO), "main", {
          authentication: cdk.SecretValue.secretsManager("github-oauth-token"),
          trigger: GitHubTrigger.POLL,
        }),
        commands: [
          "npm ci",
          "npm run build",
          "npx cdk list", // for debugging
          "npx cdk synth",
        ],
        env: {
          account: String(process.env.ACCOUNT),
          region: String(process.env.REGION),
          repo: String(process.env.REPO),
          owner: String(process.env.OWNER),
        },
        primaryOutputDirectory: "./cdk.out",
      }),
    });

    pipeline.addStage(new SetupResourceStage(this, "DevStage", {}));
  }
}
