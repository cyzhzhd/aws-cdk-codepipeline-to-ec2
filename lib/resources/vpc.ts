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

    // This VPC has 3 public subnets, and that's it
    this.vpc = new Vpc(this, "main_vpc", {
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "pub01",
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "pub02",
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "pub03",
          subnetType: SubnetType.PUBLIC,
        },
      ],
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
