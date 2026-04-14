"use client";

import { MapPin, Phone, Mail, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactUsPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Message sent! We will get back to you shortly.");
    e.target.reset();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-8 pb-16 pt-28 md:pt-36">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Get in Touch
          </h1>
          <p className="text-gray-500 text-lg">
            Looking to become a dealer, or have a question about our inventory?
            We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="p-3 bg-purple-50 text-[#522874] rounded-xl">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Head Office</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Bhind Road, Gohad Chouraha, 477116
                  <br />
                  Madhya Pradesh, India
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Call Us</h3>
                <p className="text-gray-500 text-sm mt-1">
                  +91 98276 20625
                  <br />
                  Mon - Sat, 10am to 6pm
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Email</h3>
                <p className="text-gray-500 text-sm mt-1">
                  unnatitradersbhind@gmail.com
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Your Name
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Phone Number
                  </label>
                  <input
                    required
                    type="tel"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none"
                    placeholder="+91 00000 00000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Message / Enquiry
                </label>
                <textarea
                  required
                  rows="4"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#522874] outline-none resize-none"
                  placeholder="How can we help you?"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#522874] hover:bg-[#3d1d56] text-white py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" /> Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
