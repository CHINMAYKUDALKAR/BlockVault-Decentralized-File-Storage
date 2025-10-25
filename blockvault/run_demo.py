#!/usr/bin/env python3
"""
BlockVault Legal Features Demo Runner
====================================

This script provides an interactive demo interface for showcasing
BlockVault's advanced legal features. It can be run standalone or
integrated with the main application.

Usage:
    python run_demo.py
    python run_demo.py --scenario case_management
    python run_demo.py --all
"""

import argparse
import sys
import time
import json
from demo_simulator import BlockVaultDemoSimulator

class DemoRunner:
    def __init__(self):
        self.simulator = BlockVaultDemoSimulator()
        self.demo_scenarios = [
            {
                "id": "case_management",
                "title": "Case Management with RBAC",
                "description": "Demonstrate case creation, team management, and role-based access control"
            },
            {
                "id": "document_notarization", 
                "title": "Document Notarization with ZK Proofs",
                "description": "Demonstrate secure document upload, hashing, and blockchain registration"
            },
            {
                "id": "verifiable_redaction",
                "title": "Verifiable Redaction (ZKPT)",
                "description": "Demonstrate zero-knowledge proof of transformation for document redaction"
            },
            {
                "id": "verifiable_ai_analysis",
                "title": "Verifiable AI Analysis (ZKML)",
                "description": "Demonstrate zero-knowledge machine learning for contract analysis"
            },
            {
                "id": "e_signature",
                "title": "E-Signature Workflow",
                "description": "Demonstrate secure electronic signature process"
            },
            {
                "id": "complete_workflow",
                "title": "Complete Legal Workflow",
                "description": "Demonstrate the complete legal document workflow from upload to signature"
            }
        ]

    def print_banner(self):
        """Print the demo banner"""
        print("=" * 80)
        print("🚀 BlockVault Legal Features Demo")
        print("=" * 80)
        print("Advanced cryptographic protocols for legal document management")
        print("Zero-Knowledge Proofs • Blockchain Integration • AI Analysis")
        print("=" * 80)

    def print_scenarios(self):
        """Print available demo scenarios"""
        print("\n📋 Available Demo Scenarios:")
        print("-" * 50)
        for i, scenario in enumerate(self.demo_scenarios, 1):
            print(f"{i}. {scenario['title']}")
            print(f"   {scenario['description']}")
            print()

    def get_user_choice(self):
        """Get user's scenario choice"""
        while True:
            try:
                choice = input("Enter scenario number (1-6) or 'all' for all scenarios: ").strip()
                
                if choice.lower() == 'all':
                    return 'all'
                
                choice_num = int(choice)
                if 1 <= choice_num <= len(self.demo_scenarios):
                    return self.demo_scenarios[choice_num - 1]['id']
                else:
                    print("❌ Invalid choice. Please enter a number between 1 and 6.")
            except ValueError:
                print("❌ Invalid input. Please enter a number or 'all'.")

    def run_scenario(self, scenario_id):
        """Run a specific demo scenario"""
        scenario = next((s for s in self.demo_scenarios if s['id'] == scenario_id), None)
        if not scenario:
            print(f"❌ Scenario '{scenario_id}' not found")
            return

        print(f"\n🎬 Running Demo: {scenario['title']}")
        print(f"📝 Description: {scenario['description']}")
        print("=" * 60)

        # Run the specific scenario simulation
        if scenario_id == "case_management":
            self.simulate_case_management()
        elif scenario_id == "document_notarization":
            self.simulate_document_notarization()
        elif scenario_id == "verifiable_redaction":
            self.simulate_verifiable_redaction()
        elif scenario_id == "verifiable_ai_analysis":
            self.simulate_verifiable_ai_analysis()
        elif scenario_id == "e_signature":
            self.simulate_esignature_workflow()
        elif scenario_id == "complete_workflow":
            self.simulate_complete_workflow()
        else:
            print(f"❌ Unknown scenario: {scenario_id}")

    def simulate_case_management(self):
        """Simulate case management demo"""
        print("\n📁 CASE MANAGEMENT DEMO")
        print("-" * 30)
        
        print("1. Creating new legal case...")
        time.sleep(1)
        print("   ✅ Case created: 'Corporate Merger Review'")
        print("   ✅ Case ID: case_003")
        print("   ✅ Status: Active")
        
        print("\n2. Adding team members...")
        time.sleep(1)
        print("   ✅ Lead Attorney: Alice Chen")
        print("   ✅ Associate: Bob Smith") 
        print("   ✅ Paralegal: Carol Davis")
        
        print("\n3. Configuring role-based access control...")
        time.sleep(1)
        print("   ✅ Lead Attorney: Full access")
        print("   ✅ Associate: Read/Write access")
        print("   ✅ Paralegal: Read-only access")
        
        print("\n✅ Case management setup complete!")

    def simulate_document_notarization(self):
        """Simulate document notarization demo"""
        print("\n📄 DOCUMENT NOTARIZATION DEMO")
        print("-" * 30)
        
        print("1. Uploading document...")
        time.sleep(1)
        print("   ✅ Document: 'Employment Agreement.pdf'")
        print("   ✅ Size: 2.3 MB")
        print("   ✅ Type: Contract")
        
        print("\n2. Calculating cryptographic hash...")
        time.sleep(1)
        print("   ✅ Hash: a1b2c3d4e5f6...")
        print("   ✅ Algorithm: SHA-256")
        
        print("\n3. Uploading to IPFS...")
        time.sleep(1)
        print("   ✅ IPFS CID: QmXyZ123...")
        print("   ✅ Decentralized storage confirmed")
        
        print("\n4. Generating ZK proof...")
        time.sleep(1)
        print("   ✅ ZK proof: zk_proof_001")
        print("   ✅ Proof of integrity generated")
        
        print("\n5. Registering on blockchain...")
        time.sleep(1)
        print("   ✅ Transaction hash: 0x1234567890abcdef...")
        print("   ✅ Document registered on blockchain")
        
        print("\n✅ Document notarization complete!")

    def simulate_verifiable_redaction(self):
        """Simulate verifiable redaction demo"""
        print("\n🔒 VERIFIABLE REDACTION DEMO (ZKPT)")
        print("-" * 30)
        
        print("1. Selecting document for redaction...")
        time.sleep(1)
        print("   ✅ Document: 'Employment Agreement - Smith.pdf'")
        print("   ✅ Contains privileged information")
        
        print("\n2. Configuring redaction rules...")
        time.sleep(1)
        print("   ✅ Remove chunks 1, 3, 5 (privileged information)")
        print("   ✅ Preserve document structure")
        
        print("\n3. Applying redaction...")
        time.sleep(1)
        print("   ✅ Redacted document created")
        print("   ✅ Privileged information removed")
        
        print("\n4. Generating ZKPT proof...")
        time.sleep(1)
        print("   ✅ ZKPT proof: zkpt_proof_001")
        print("   ✅ Proof of valid transformation")
        
        print("\n5. Verifying transformation...")
        time.sleep(1)
        print("   ✅ Transformation verified")
        print("   ✅ Chain of custody maintained")
        
        print("\n✅ Verifiable redaction complete!")

    def simulate_verifiable_ai_analysis(self):
        """Simulate verifiable AI analysis demo"""
        print("\n🤖 VERIFIABLE AI ANALYSIS DEMO (ZKML)")
        print("-" * 30)
        
        print("1. Selecting AI model...")
        time.sleep(1)
        print("   ✅ Model: Linear Regression")
        print("   ✅ Parameters: m=2, b=3")
        
        print("\n2. Configuring analysis...")
        time.sleep(1)
        print("   ✅ Private input: x=5")
        print("   ✅ Expected output: y=13")
        
        print("\n3. Running AI analysis...")
        time.sleep(1)
        print("   ✅ Analysis completed")
        print("   ✅ Result: y=13 (matches expected)")
        
        print("\n4. Generating ZKML proof...")
        time.sleep(1)
        print("   ✅ ZKML proof: zkml_proof_001")
        print("   ✅ Proof of correct computation")
        
        print("\n5. Verifying analysis...")
        time.sleep(1)
        print("   ✅ Analysis verified")
        print("   ✅ Confidence score: 0.95")
        print("   ✅ Risk level: Medium")
        
        print("\n✅ Verifiable AI analysis complete!")

    def simulate_esignature_workflow(self):
        """Simulate e-signature workflow demo"""
        print("\n✍️ E-SIGNATURE WORKFLOW DEMO")
        print("-" * 30)
        
        print("1. Creating signature request...")
        time.sleep(1)
        print("   ✅ Document: Employment Agreement - Smith.pdf")
        print("   ✅ Recipient: John Smith")
        print("   ✅ Deadline: 2024-02-15")
        
        print("\n2. Sending request...")
        time.sleep(1)
        print("   ✅ Request sent to recipient")
        print("   ✅ Notification delivered")
        
        print("\n3. Recipient review...")
        time.sleep(1)
        print("   ✅ Document reviewed")
        print("   ✅ Document signed")
        
        print("\n4. Verifying signature...")
        time.sleep(1)
        print("   ✅ Signature verified")
        print("   ✅ Document status: Signed")
        
        print("\n✅ E-signature workflow complete!")

    def simulate_complete_workflow(self):
        """Simulate complete workflow demo"""
        print("\n🔄 COMPLETE LEGAL WORKFLOW DEMO")
        print("-" * 30)
        
        print("1. Case setup...")
        time.sleep(1)
        print("   ✅ Case created: 'Corporate Merger Review'")
        print("   ✅ Team members added")
        print("   ✅ Access control configured")
        
        print("\n2. Document upload and notarization...")
        time.sleep(1)
        print("   ✅ Documents uploaded")
        print("   ✅ Cryptographic hashes calculated")
        print("   ✅ Documents registered on blockchain")
        
        print("\n3. Document redaction...")
        time.sleep(1)
        print("   ✅ Privileged information redacted")
        print("   ✅ ZKPT proofs generated")
        print("   ✅ Chain of custody maintained")
        
        print("\n4. AI analysis...")
        time.sleep(1)
        print("   ✅ AI analysis performed")
        print("   ✅ ZKML proofs generated")
        print("   ✅ Results verified")
        
        print("\n5. Signature workflow...")
        time.sleep(1)
        print("   ✅ Signature requests sent")
        print("   ✅ Signatures collected")
        print("   ✅ Signatures verified")
        
        print("\n6. Audit trail generation...")
        time.sleep(1)
        print("   ✅ Complete audit trail generated")
        print("   ✅ All actions documented")
        print("   ✅ Compliance verified")
        
        print("\n✅ Complete legal workflow finished!")

    def run_all_scenarios(self):
        """Run all demo scenarios"""
        print("\n🎬 Running All Demo Scenarios")
        print("=" * 60)
        
        for scenario in self.demo_scenarios:
            print(f"\n📋 Scenario: {scenario['title']}")
            print(f"📝 Description: {scenario['description']}")
            print("-" * 40)
            
            self.run_scenario(scenario['id'])
            
            if scenario != self.demo_scenarios[-1]:  # Not the last scenario
                print("\n⏳ Waiting 3 seconds before next scenario...")
                time.sleep(3)
        
        print("\n🎉 All demo scenarios completed!")
        print("🚀 BlockVault Legal: The Future of Legal Technology!")

    def run_interactive_demo(self):
        """Run interactive demo"""
        self.print_banner()
        self.print_scenarios()
        
        choice = self.get_user_choice()
        
        if choice == 'all':
            self.run_all_scenarios()
        else:
            self.run_scenario(choice)
        
        print("\n🎉 Demo completed!")
        print("📁 Demo data saved to demo_data.json")
        print("🔗 Use this data to populate your BlockVault application")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='BlockVault Legal Features Demo')
    parser.add_argument('--scenario', help='Run specific scenario')
    parser.add_argument('--all', action='store_true', help='Run all scenarios')
    parser.add_argument('--interactive', action='store_true', help='Run interactive demo')
    
    args = parser.parse_args()
    
    runner = DemoRunner()
    
    if args.scenario:
        runner.print_banner()
        runner.run_scenario(args.scenario)
    elif args.all:
        runner.print_banner()
        runner.run_all_scenarios()
    else:
        runner.run_interactive_demo()

if __name__ == "__main__":
    main()
