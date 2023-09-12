import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { GitHubTrigger } from "aws-cdk-lib/aws-codepipeline-actions";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { SetupResourceStage } from "./pipeline-stages";

export class PythonEc2BlogpostStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "BlogPipeline", {
      pipelineName: "BlogPipeline",
      synth: new CodeBuildStep("Synth", {
        input: CodePipelineSource.connection(String(process.env.REPO), "main", {
          connectionArn: String(process.env.CONNECTION_ARN),
        }),
        installCommands: ["npm install -g aws-cdk"],
        commands: ["npm ci", "npm run build", "npx cdk list", "npx cdk synth"],
        env: {
          ACCOUNT: String(process.env.ACCOUNT),
          REGION: String(process.env.REGION),
          REOP: String(process.env.REPO),
          OWNER: String(process.env.OWNER),
          CONNECTION_ARN: String(process.env.CONNECTION_ARN),
        },
      }),
    });

    pipeline.addStage(new SetupResourceStage(this, "DevStage", {}));
  }
}
