import { Link } from "@tanstack/react-router";
import {
  Github,
  Twitter,
  Mail,
  Phone,
  MapPin,
  ChevronUp,
  Facebook,
  Instagram,
  Linkedin,
  Building,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img src="/logo-light.svg" alt="logo-light" width={30} />
                <span className="text-2xl font-bold ml-2 text-white">UniForm</span>
              </Link>
            </div>
            <p className="text-gray-400 max-w-md">
              Streamlining university application processes with innovative form solutions.
              Making education accessible through technology.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-all">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-all">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-all">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-all">
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/AongCho880/UniForm.git"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b border-gray-800 pb-2">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                  <ChevronUp className="h-4 w-4 rotate-90" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                  <ChevronUp className="h-4 w-4 rotate-90" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link to="/help" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                  <ChevronUp className="h-4 w-4 rotate-90" />
                  <span>Help Center</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                  <ChevronUp className="h-4 w-4 rotate-90" />
                  <span>Contact</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Access & Legal */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold border-b border-gray-800 pb-2">Access</h3>
              <ul className="space-y-3 mt-3">
                <li>
                  <Link to="/admin/adminLogin" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                    <Shield className="h-4 w-4" />
                    <span>Admin Login</span>
                  </Link>
                </li>
                <li>
                  <Link to="/institution/institutionLogin" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                    <Building className="h-4 w-4" />
                    <span>Institution Login</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold border-b border-gray-800 pb-2">Legal</h3>
              <ul className="space-y-3 mt-3">
                <li>
                  <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="text-gray-400 hover:text-white transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8 mb-6 md:mb-0">
              <div className="flex items-center space-x-3 text-gray-400">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  <Mail className="h-5 w-5" />
                </div>
                <span>support@uniform.edu</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
                <span>+880 15XXXXXXXX</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
                <span>University of Chittagong, Chittagong, Bangladesh</span>
              </div>
            </div>
            <Button
              onClick={scrollToTop}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1 border-gray-700 text-black hover:bg-gray-200"
            >
              <span>Back to top</span>
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 text-center text-gray-500 text-sm">
          <p>&copy; {currentYear} UniForm Project. All rights reserved.</p>
          <p className="mt-1">Designed with ❤️ for education</p>
        </div>
      </div>
    </footer>
  );
}