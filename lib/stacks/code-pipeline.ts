import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { Pipeline, Artifact } from "aws-cdk-lib/aws-codepipeline";
import {
  GitHubSourceAction,
  CodeBuildAction,
  CodeDeployServerDeployAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import { PipelineProject, LinuxBuildImage } from "aws-cdk-lib/aws-codebuild";
import {
  ServerDeploymentGroup,
  ServerApplication,
  InstanceTagSet,
} from "aws-cdk-lib/aws-codedeploy";
import { SecretValue } from "aws-cdk-lib";

export interface CodePipelineStackProps extends cdk.StackProps {}

export class CodePipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CodePipelineStackProps) {
    super(scope, id, props);

    // Pipeline
    // CodePipeline
    const pipeline = new Pipeline(this, "python_web_pipeline", {
      pipelineName: "python-webApp",
      crossAccountKeys: false, // solves the encrypted bucket issue
    });

    // STAGES
    // Source Stage
    const sourceStage = pipeline.addStage({
      stageName: "Source",
    });

    // Build Stage
    const buildStage = pipeline.addStage({
      stageName: "Build",
    });

    // Deploy Stage
    const deployStage = pipeline.addStage({
      stageName: "Deploy",
    });

    // Add some action
    // Source action
    const sourceOutput = new Artifact();
    const githubSourceAction = new GitHubSourceAction({
      actionName: "GithubSource",
      oauthToken: SecretValue.secretsManager("github-oauth-token"),
      owner: String(process.env.OWNER),
      repo: "sample-python-web-app",
      branch: "main",
      output: sourceOutput,
    });

    sourceStage.addAction(githubSourceAction);

    // Build Action
    const pythonTestProject = new PipelineProject(this, "pythonTestProject", {
      environment: {
        buildImage: LinuxBuildImage.AMAZON_LINUX_2_3,
      },
    });

    const pythonTestOutput = new Artifact();
    const pythonTestAction = new CodeBuildAction({
      actionName: "TestPython",
      project: pythonTestProject,
      input: sourceOutput,
      outputs: [pythonTestOutput],
    });

    buildStage.addAction(pythonTestAction);

    // Deploy Actions
    const pythonDeployApplication = new ServerApplication(
      this,
      "python_deploy_application",
      {
        applicationName: "python-webApp",
      }
    );

    // Deployment group
    const pythonServerDeploymentGroup = new ServerDeploymentGroup(
      this,
      "PythonAppDeployGroup",
      {
        application: pythonDeployApplication,
        deploymentGroupName: "PythonAppDeploymentGroup",
        installAgent: true,
        ec2InstanceTags: new InstanceTagSet({
          "application-name": ["python-web"],
          stage: ["prod", "stage"],
        }),
      }
    );

    // Deployment action
    const pythonDeployAction = new CodeDeployServerDeployAction({
      actionName: "PythonAppDeployment",
      input: sourceOutput,
      deploymentGroup: pythonServerDeploymentGroup,
    });

    deployStage.addAction(pythonDeployAction);
  }
}
