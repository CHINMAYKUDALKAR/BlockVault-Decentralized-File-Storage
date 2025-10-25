#!/usr/bin/env python3
"""
BlockVault Legal Demo Test Script
=================================

This script tests all the demo components to ensure they work correctly.

Usage:
    python test_demo.py
"""

import sys
import os
from pathlib import Path

def test_demo_simulator():
    """Test the demo simulator"""
    print("🧪 Testing Demo Simulator...")
    try:
        from demo_simulator import BlockVaultDemoSimulator
        simulator = BlockVaultDemoSimulator()
        print("✅ Demo simulator imported successfully")
        
        # Test data creation
        if simulator.demo_data:
            print(f"✅ Demo data created: {len(simulator.demo_data)} categories")
            for category, data in simulator.demo_data.items():
                print(f"   • {category}: {len(data)} items")
        else:
            print("❌ Demo data not created")
            return False
            
        return True
    except Exception as e:
        print(f"❌ Demo simulator test failed: {e}")
        return False

def test_demo_runner():
    """Test the demo runner"""
    print("\n🧪 Testing Demo Runner...")
    try:
        from run_demo import DemoRunner
        runner = DemoRunner()
        print("✅ Demo runner imported successfully")
        
        # Test scenario creation
        scenarios = runner.demo_scenarios
        if scenarios:
            print(f"✅ Demo scenarios created: {len(scenarios)} scenarios")
            for scenario in scenarios:
                print(f"   • {scenario['title']}")
        else:
            print("❌ Demo scenarios not created")
            return False
            
        return True
    except Exception as e:
        print(f"❌ Demo runner test failed: {e}")
        return False

def test_showcase_demo():
    """Test the showcase demo"""
    print("\n🧪 Testing Showcase Demo...")
    try:
        from showcase_demo import BlockVaultShowcase
        showcase = BlockVaultShowcase()
        print("✅ Showcase demo imported successfully")
        
        # Test demo data
        if showcase.demo_data:
            print(f"✅ Showcase demo data available: {len(showcase.demo_data)} categories")
        else:
            print("❌ Showcase demo data not available")
            return False
            
        return True
    except Exception as e:
        print(f"❌ Showcase demo test failed: {e}")
        return False

def test_demo_launcher():
    """Test the demo launcher"""
    print("\n🧪 Testing Demo Launcher...")
    try:
        from start_demo import DemoLauncher
        launcher = DemoLauncher()
        print("✅ Demo launcher imported successfully")
        
        # Test project paths
        if launcher.project_root.exists():
            print(f"✅ Project root found: {launcher.project_root}")
        else:
            print("❌ Project root not found")
            return False
            
        if launcher.backend_dir.exists():
            print(f"✅ Backend directory found: {launcher.backend_dir}")
        else:
            print("❌ Backend directory not found")
            return False
            
        if launcher.frontend_dir.exists():
            print(f"✅ Frontend directory found: {launcher.frontend_dir}")
        else:
            print("❌ Frontend directory not found")
            return False
            
        return True
    except Exception as e:
        print(f"❌ Demo launcher test failed: {e}")
        return False

def test_demo_data_file():
    """Test if demo data file exists"""
    print("\n🧪 Testing Demo Data File...")
    try:
        demo_data_file = Path("demo_data.json")
        if demo_data_file.exists():
            print("✅ Demo data file exists")
            
            # Test file content
            import json
            with open(demo_data_file, 'r') as f:
                data = json.load(f)
                print(f"✅ Demo data file contains: {len(data)} categories")
                for category, items in data.items():
                    print(f"   • {category}: {len(items)} items")
        else:
            print("❌ Demo data file not found")
            return False
            
        return True
    except Exception as e:
        print(f"❌ Demo data file test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 BlockVault Legal Demo Test Suite")
    print("=" * 50)
    
    tests = [
        test_demo_simulator,
        test_demo_runner,
        test_showcase_demo,
        test_demo_launcher,
        test_demo_data_file
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 All tests passed! Demo system is ready.")
        print("🚀 You can now run the demos:")
        print("   • python demo_simulator.py")
        print("   • python run_demo.py")
        print("   • python showcase_demo.py")
        print("   • python start_demo.py")
    else:
        print(f"\n⚠️ {total - passed} tests failed. Please check the errors above.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
