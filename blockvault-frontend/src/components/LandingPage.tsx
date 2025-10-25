import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Globe, Zap, ArrowRight, CheckCircle, Smartphone, Wallet, Star, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MobileWalletModal } from './MobileWalletModal';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isMobile, connectWallet, loading } = useAuth();
  const [showMobileWallet, setShowMobileWallet] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const features = [
    {
      icon: Shield,
      title: "End-to-End Encryption",
      description: "Your files are encrypted before leaving your device with military-grade security"
    },
    {
      icon: Lock,
      title: "Web3 Security",
      description: "Blockchain-based authentication ensures only you can access your files"
    },
    {
      icon: Globe,
      title: "IPFS Storage",
      description: "Decentralized storage across the global network for maximum reliability"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Quick upload and download with optimized performance and caching"
    }
  ];

  const stats = [
    { number: "256-bit", label: "Encryption", icon: Lock },
    { number: "99.9%", label: "Uptime", icon: Globe },
    { number: "∞", label: "Storage", icon: FileText },
    { number: "0", label: "Data Collection", icon: Shield }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Security Researcher",
      content: "BlockVault has revolutionized how I store sensitive research data. The encryption is bulletproof.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Blockchain Developer",
      content: "Finally, a file storage solution that truly respects privacy. The Web3 integration is seamless.",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Digital Artist",
      content: "I can store my artwork securely and share it with clients without worrying about data breaches.",
      rating: 5
    }
  ];

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  // Fade in animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Hero Section */}
      <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-3 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">BlockVault</h1>
            </div>
            
            <h2 className="text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              Secure Your
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block">
                Digital Life
              </span>
            </h2>
            
            <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              The most secure way to store, share, and manage your files with 
              blockchain technology, end-to-end encryption, and zero-knowledge architecture.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {!isMobile ? (
                <Button
                  onClick={connectWallet}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-6 h-6" />
                      <span>Connect Wallet</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setShowMobileWallet(true)}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-6 h-6" />
                      <span>Connect Mobile Wallet</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">Why Choose BlockVault?</h3>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Built with cutting-edge technology to provide the most secure file storage experience
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Features Carousel */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50">
              <div className="flex items-start space-x-6 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  {React.createElement(features[currentFeature].icon, { className: "w-8 h-8 text-white" })}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white mb-3">
                    {features[currentFeature].title}
                  </h4>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    {features[currentFeature].description}
                  </p>
                </div>
              </div>
              
              {/* Feature Indicators */}
              <div className="flex space-x-3">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFeature(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentFeature 
                        ? 'bg-blue-500 w-12' 
                        : 'bg-slate-600 hover:bg-slate-500 w-3'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              {[
                "End-to-end encryption before upload",
                "Web3 authentication with your wallet",
                "Decentralized IPFS storage",
                "Secure file sharing with permissions",
                "Zero-knowledge architecture",
                "Cross-platform compatibility"
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span className="text-slate-300 text-lg">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="relative z-10 py-16 bg-slate-800/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">Trusted by Users</h3>
            <p className="text-xl text-slate-300">See what our community says about BlockVault</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-slate-400 text-sm">{testimonial.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative z-10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl font-bold text-white mb-4">Ready to Secure Your Files?</h3>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust BlockVault with their most important files
          </p>
          
          {!isMobile ? (
            <Button
              onClick={connectWallet}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Wallet className="w-6 h-6" />
                  <span>Get Started Now</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setShowMobileWallet(true)}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-6 h-6" />
                  <span>Connect Mobile Wallet</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Wallet Modal */}
      {showMobileWallet && (
        <MobileWalletModal onClose={() => setShowMobileWallet(false)} />
      )}
    </div>
  );
};
