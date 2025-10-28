import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Globe, Zap, ArrowRight, CheckCircle, Smartphone, Wallet, Star, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MobileWalletModal } from './MobileWalletModal';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isMobile, connectWallet, login, loading, isConnected, user } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary grid-pattern noise-texture relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-accent-400/5 to-transparent rounded-full"></div>
      </div>
      
      {/* Hero Section */}
      <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-3 mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-400 rounded-3xl flex items-center justify-center premium-shadow-lg animate-glow">
                <Shield className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              <h1 className="text-5xl font-black text-white tracking-tight font-display drop-shadow-xl">BlockVault</h1>
            </div>
            
            <h2 className="text-7xl lg:text-8xl font-black text-white mb-12 leading-none font-display tracking-tighter">
              Secure Your
              <span className="text-gradient block animate-shimmer bg-size-200">
                Digital Life
              </span>
            </h2>
            
            <p className="text-2xl text-text-secondary mb-16 max-w-4xl mx-auto leading-relaxed font-medium">
              The most secure way to store, share, and manage your files with 
              blockchain technology, end-to-end encryption, and zero-knowledge architecture.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {!isConnected ? (
                !isMobile ? (
                  <Button
                    onClick={connectWallet}
                    disabled={loading}
                    variant="primary"
                    size="lg"
                    className="text-lg font-bold tracking-wide shadow-2xl"
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
                    variant="primary"
                    size="lg"
                    className="text-lg font-bold tracking-wide shadow-2xl"
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
                )
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center space-x-3 bg-secondary-800/50 backdrop-blur-sm rounded-xl px-6 py-3 border border-secondary-700/50">
                    <div className="w-3 h-3 bg-status-success rounded-full animate-pulse"></div>
                    <span className="text-text-secondary font-mono text-lg">
                      {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
                    </span>
                  </div>
                  <Button
                    onClick={login}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing Message...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Shield className="w-6 h-6" />
                        <span>Complete Login</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-text-secondary">{stat.label}</div>
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
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Built with cutting-edge technology to provide the most secure file storage experience
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Features Carousel */}
            <div className="bg-secondary-800/50 backdrop-blur-sm rounded-3xl p-8 border border-secondary-700/50">
              <div className="flex items-start space-x-6 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                  {React.createElement(features[currentFeature].icon, { className: "w-8 h-8 text-white" })}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white mb-3">
                    {features[currentFeature].title}
                  </h4>
                  <p className="text-text-secondary text-lg leading-relaxed">
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
                        ? 'bg-accent-400 w-12' 
                        : 'bg-secondary-600 hover:bg-secondary-500 w-3'
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
                  <CheckCircle className="w-6 h-6 text-status-success flex-shrink-0" />
                  <span className="text-text-secondary text-lg">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="relative z-10 py-16 bg-secondary-800/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">Trusted by Users</h3>
            <p className="text-xl text-text-secondary">See what our community says about BlockVault</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 bg-secondary-800/50 backdrop-blur-sm border border-secondary-700/50">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-status-warning fill-current" />
                  ))}
                </div>
                <p className="text-text-secondary mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-text-secondary text-sm">{testimonial.role}</div>
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
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust BlockVault with their most important files
          </p>
          
          {!isConnected ? (
            !isMobile ? (
              <Button
                onClick={connectWallet}
                disabled={loading}
                className="text-lg font-bold tracking-wide shadow-2xl"
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
                className="text-lg font-bold tracking-wide shadow-2xl"
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
            )
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-3 bg-secondary-800/50 backdrop-blur-sm rounded-xl px-6 py-3 border border-secondary-700/50">
                <div className="w-3 h-3 bg-status-success rounded-full animate-pulse"></div>
                <span className="text-text-secondary font-mono text-lg">
                  {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
                </span>
              </div>
              <Button
                onClick={login}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing Message...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Shield className="w-6 h-6" />
                    <span>Complete Login</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </div>
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
