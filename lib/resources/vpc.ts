import {
  SecurityGroup,
  Peer,
  Port,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class VPCResources extends Construct {
  public webSg: SecurityGroup;
  public vpc: Vpc;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.vpc = new Vpc(this, "main_vpc", {
      natGateways: 1,
    });

    // Security Groups
    // This SG will allow SSH and HTTP traffic
    this.webSg = new SecurityGroup(this, "web_sg", {
      vpc: this.vpc,
      description: "Allows Inbound HTTP traffic to the web server.",
      allowAllOutbound: true,
    });

    this.webSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80));
    this.webSg.addIngressRule(Peer.anyIpv4(), Port.tcp(22));
  }
}
