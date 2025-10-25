#!/usr/bin/env python3
"""
BlockVault Legal Demo Launcher
==============================

This script provides a unified interface for launching all demo components.
It can start the backend, frontend, and demo simulations.

Usage:
    python start_demo.py
    python start_demo.py --backend-only
    python start_demo.py --frontend-only
    python start_demo.py --demo-only
"""

import argparse
import subprocess
import sys
import time
import os
from pathlib import Path

class DemoLauncher:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_dir = self.project_root
        self.frontend_dir = self.project_root.parent / "blockvault-frontend"
        
    def print_banner(self):
        """Print the demo launcher banner"""
        print("=" * 80)
        print("🚀 BlockVault Legal Demo Launcher")
        print("=" * 80)
        print("Advanced cryptographic protocols for legal document management")
        print("Zero-Knowledge Proofs • Blockchain Integration • AI Analysis")
        print("=" * 80)
    
    def check_dependencies(self):
        """Check if required dependencies are installed"""
        print("🔍 Checking dependencies...")
        
        # Check Python dependencies
        try:
            import flask
            import requests
            print("✅ Python dependencies OK")
        except ImportError as e:
            print(f"❌ Missing Python dependency: {e}")
            print("💡 Run: pip install -r requirements.txt")
            return False
        
        # Check Node.js dependencies
        if self.frontend_dir.exists():
            try:
                result = subprocess.run(
                    ["npm", "list", "--depth=0"],
                    cwd=self.frontend_dir,
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0:
                    print("✅ Node.js dependencies OK")
                else:
                    print("❌ Node.js dependencies missing")
                    print("💡 Run: cd blockvault-frontend && npm install")
                    return False
            except FileNotFoundError:
                print("❌ Node.js not found")
                print("💡 Install Node.js from https://nodejs.org/")
                return False
        else:
            print("❌ Frontend directory not found")
            return False
        
        return True
    
    def start_backend(self):
        """Start the backend server"""
        print("🚀 Starting backend server...")
        try:
            # Start backend in background
            process = subprocess.Popen(
                [sys.executable, "app.py"],
                cwd=self.backend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait a moment for server to start
            time.sleep(3)
            
            # Check if server is running
            if process.poll() is None:
                print("✅ Backend server started on http://localhost:5000")
                return process
            else:
                print("❌ Backend server failed to start")
                return None
                
        except Exception as e:
            print(f"❌ Error starting backend: {e}")
            return None
    
    def start_frontend(self):
        """Start the frontend development server"""
        print("🚀 Starting frontend server...")
        try:
            # Start frontend in background
            process = subprocess.Popen(
                ["npm", "start"],
                cwd=self.frontend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait a moment for server to start
            time.sleep(5)
            
            # Check if server is running
            if process.poll() is None:
                print("✅ Frontend server started on http://localhost:3000")
                return process
            else:
                print("❌ Frontend server failed to start")
                return None
                
        except Exception as e:
            print(f"❌ Error starting frontend: {e}")
            return None
    
    def run_demo_simulation(self):
        """Run the demo simulation"""
        print("🎬 Running demo simulation...")
        try:
            result = subprocess.run(
                [sys.executable, "demo_simulator.py"],
                cwd=self.backend_dir,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                print("✅ Demo simulation completed successfully")
                print("📁 Demo data saved to demo_data.json")
            else:
                print(f"❌ Demo simulation failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error running demo simulation: {e}")
            return False
        
        return True
    
    def run_interactive_demo(self):
        """Run the interactive demo"""
        print("🎬 Starting interactive demo...")
        try:
            result = subprocess.run(
                [sys.executable, "run_demo.py"],
                cwd=self.backend_dir,
                text=True
            )
            
            if result.returncode == 0:
                print("✅ Interactive demo completed")
            else:
                print("❌ Interactive demo failed")
                return False
                
        except Exception as e:
            print(f"❌ Error running interactive demo: {e}")
            return False
        
        return True
    
    def launch_full_demo(self):
        """Launch the complete demo environment"""
        print("🚀 Launching complete BlockVault Legal demo...")
        
        # Check dependencies
        if not self.check_dependencies():
            print("❌ Dependency check failed. Please install required dependencies.")
            return False
        
        # Start backend
        backend_process = self.start_backend()
        if not backend_process:
            print("❌ Failed to start backend. Demo cannot continue.")
            return False
        
        # Start frontend
        frontend_process = self.start_frontend()
        if not frontend_process:
            print("❌ Failed to start frontend. Demo cannot continue.")
            backend_process.terminate()
            return False
        
        # Run demo simulation
        if not self.run_demo_simulation():
            print("❌ Demo simulation failed.")
            backend_process.terminate()
            frontend_process.terminate()
            return False
        
        print("\n🎉 Demo environment launched successfully!")
        print("=" * 60)
        print("🌐 Frontend: http://localhost:3000")
        print("🔧 Backend: http://localhost:5000")
        print("📁 Demo data: demo_data.json")
        print("=" * 60)
        print("💡 Press Ctrl+C to stop all services")
        
        try:
            # Keep services running
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Stopping demo services...")
            backend_process.terminate()
            frontend_process.terminate()
            print("✅ Demo services stopped")
        
        return True
    
    def launch_backend_only(self):
        """Launch backend only"""
        print("🚀 Launching backend only...")
        
        if not self.check_dependencies():
            return False
        
        backend_process = self.start_backend()
        if not backend_process:
            return False
        
        print("✅ Backend running on http://localhost:5000")
        print("💡 Press Ctrl+C to stop")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Stopping backend...")
            backend_process.terminate()
            print("✅ Backend stopped")
        
        return True
    
    def launch_frontend_only(self):
        """Launch frontend only"""
        print("🚀 Launching frontend only...")
        
        if not self.check_dependencies():
            return False
        
        frontend_process = self.start_frontend()
        if not frontend_process:
            return False
        
        print("✅ Frontend running on http://localhost:3000")
        print("💡 Press Ctrl+C to stop")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Stopping frontend...")
            frontend_process.terminate()
            print("✅ Frontend stopped")
        
        return True
    
    def launch_demo_only(self):
        """Launch demo simulation only"""
        print("🚀 Launching demo simulation only...")
        
        if not self.check_dependencies():
            return False
        
        # Run demo simulation
        if not self.run_demo_simulation():
            return False
        
        # Run interactive demo
        if not self.run_interactive_demo():
            return False
        
        print("✅ Demo simulation completed")
        return True

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='BlockVault Legal Demo Launcher')
    parser.add_argument('--backend-only', action='store_true', help='Start backend only')
    parser.add_argument('--frontend-only', action='store_true', help='Start frontend only')
    parser.add_argument('--demo-only', action='store_true', help='Run demo simulation only')
    parser.add_argument('--interactive', action='store_true', help='Run interactive demo')
    
    args = parser.parse_args()
    
    launcher = DemoLauncher()
    launcher.print_banner()
    
    if args.backend_only:
        launcher.launch_backend_only()
    elif args.frontend_only:
        launcher.launch_frontend_only()
    elif args.demo_only:
        launcher.launch_demo_only()
    elif args.interactive:
        launcher.run_interactive_demo()
    else:
        launcher.launch_full_demo()

if __name__ == "__main__":
    main()
