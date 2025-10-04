import React from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const LandingPage = () => {
  const features = [
    {
      name: 'AI-Powered Simplification',
      description: 'Transform complex medical terms into easy-to-understand language using advanced AI technology.',
      icon: DocumentTextIcon,
    },
    {
      name: 'Intelligent Chat Assistant',
      description: 'Get instant answers to your health questions with our AI-powered medical assistant.',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      name: 'Doctor Appointments',
      description: 'Book appointments with verified doctors and get personalized healthcare consultations.',
      icon: CalendarDaysIcon,
    },
    {
      name: 'Multilingual Support',
      description: 'Access healthcare information in multiple languages including Hindi, Bengali, Tamil, and more.',
      icon: GlobeAltIcon,
    },
    {
      name: 'HIPAA Compliant',
      description: 'Your health data is protected with enterprise-grade security and privacy measures.',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Accessibility First',
      description: 'Designed with accessibility in mind, supporting screen readers and high contrast modes.',
      icon: HeartIcon,
    },
  ];

  const stats = [
    { label: 'Reports Processed', value: '10,000+' },
    { label: 'Happy Users', value: '5,000+' },
    { label: 'Languages Supported', value: '12+' },
    { label: 'Doctors Network', value: '500+' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-50 via-coffee-50 to-brown-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg shadow-brown border-b border-brown-200 animate-slide-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center animate-slide-in-left">
              <HeartIcon className="h-8 w-8 text-brown-600 animate-pulse" />
              <span className="ml-2 text-xl font-bold text-brown-900">SimplyMedi</span>
            </div>
            <div className="flex items-center space-x-4 animate-slide-in-right">
              <Link
                to="/login"
                className="text-secondary-700 hover:text-brown-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary interactive"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brown-600 via-coffee-700 to-secondary-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up">
              Understand Your Health Reports
              <span className="block text-brown-200 animate-slide-in-right">With AI-Powered Simplicity</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-brown-100 max-w-3xl mx-auto animate-fade-in-up">
              Transform complex medical terminology into clear, actionable insights. 
              Get personalized health recommendations and connect with healthcare professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
              <Link
                to="/register"
                className="btn bg-white text-brown-700 hover:bg-brown-50 px-8 py-3 text-lg font-semibold shadow-strong hover:shadow-brown interactive"
              >
                Start Free Trial
              </Link>
              <Link
                to="/register-doctor"
                className="btn border-2 border-white text-white hover:bg-white hover:text-brown-700 px-8 py-3 text-lg font-semibold interactive"
              >
                Join as Doctor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-brown-50 to-coffee-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold text-brown-900 mb-4">
              Why Choose SimplyMedi?
            </h2>
            <p className="text-xl text-secondary-700 max-w-2xl mx-auto">
              We're revolutionizing healthcare accessibility with cutting-edge AI technology 
              and a commitment to making health information understandable for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={feature.name} className="card p-6 hover-lift interactive animate-fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <feature.icon className="h-8 w-8 text-brown-600 animate-float" />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-brown-900">
                    {feature.name}
                  </h3>
                </div>
                <p className="text-secondary-700">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Simplify Your Healthcare Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have transformed their health understanding 
            with SimplyMedi's AI-powered platform.
          </p>
          <Link
            to="/register"
            className="btn bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 text-lg font-semibold"
          >
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <HeartIcon className="h-6 w-6 text-primary-400" />
                <span className="ml-2 text-lg font-bold">SimplyMedi</span>
              </div>
              <p className="text-gray-400">
                Making healthcare accessible and understandable for everyone through AI technology.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/features" className="hover:text-white">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link to="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link to="/status" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/cookies" className="hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SimplyMedi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
