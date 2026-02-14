import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-20 pb-10 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        
        {/* Brand Column */}
        <div className="space-y-6">
           <div className="flex items-center gap-2">
             <span className="text-3xl font-extrabold tracking-tighter text-white">BowlIt<span className="text-orange-600">.</span></span>
           </div>
           <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
             Fresh, homestyle meals delivered to your desk or door. 
             We fuel your daily hustle with zero hassle.
           </p>
           {/* Social Icons */}
           <div className="flex gap-4">
             <SocialIcon icon={Facebook} />
             <SocialIcon icon={Twitter} />
             <SocialIcon icon={Instagram} />
             <SocialIcon icon={Linkedin} />
           </div>
        </div>

        {/* Column 1: Company */}
        <div>
          <h3 className="text-lg font-bold mb-6 text-orange-500">Company</h3>
          <ul className="space-y-4 text-sm text-gray-400">
            <li><FooterLink href="/about">About us</FooterLink></li>
            <li><FooterLink href="/why-us">Why us</FooterLink></li>
            <li><FooterLink href="/join">Join Us</FooterLink></li>
            <li><FooterLink href="/careers">Careers</FooterLink></li>
            <li><FooterLink href="/contact">Contact Us</FooterLink></li>
          </ul>
        </div>

        {/* Column 2: Information */}
        <div>
          <h3 className="text-lg font-bold mb-6 text-orange-500">Information</h3>
          <ul className="space-y-4 text-sm text-gray-400">
            <li><FooterLink href="/privacy">Privacy Policy</FooterLink></li>
            <li><FooterLink href="/terms">Terms & Conditions</FooterLink></li>
            <li><FooterLink href="/refunds">Cancellation & Refunds</FooterLink></li>
            <li><FooterLink href="/blogs">Blogs</FooterLink></li>
            <li><FooterLink href="/contact">Contact us</FooterLink></li>
          </ul>
        </div>
        
        {/* Contact Info (Added for balance) */}
        <div>
           <h3 className="text-lg font-bold mb-6 text-orange-500">Get in Touch</h3>
           <ul className="space-y-4 text-sm text-gray-400">
             <li className="flex items-start gap-3">
               <MapPin size={18} className="text-orange-600 shrink-0 mt-0.5" />
               <span>Newtown, Kolkata,<br/>West Bengal - 700156</span>
             </li>
             <li className="flex items-center gap-3">
               <Phone size={18} className="text-orange-600 shrink-0" />
               <span>+91 98765 43210</span>
             </li>
             <li className="flex items-center gap-3">
               <Mail size={18} className="text-orange-600 shrink-0" />
               <span>support@bowlit.com</span>
             </li>
           </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} BowlIt Foods Pvt Ltd. All rights reserved.</p>
        <p>Made with ❤️ in India</p>
      </div>
    </footer>
  );
}

// Helper components for cleaner code
function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link href={href} className="hover:text-white hover:translate-x-1 transition-all duration-300 block w-fit">
      {children}
    </Link>
  )
}

function SocialIcon({ icon: Icon }: { icon: any }) {
  return (
    <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-orange-600 hover:text-white transition-all duration-300 hover:scale-110">
      <Icon size={18} />
    </a>
  )
}