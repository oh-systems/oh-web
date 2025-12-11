import React, { useState, useRef, useEffect } from "react";
import GlassSurface from './GlassSurface';
import { playClickSound } from '../lib/playClickSound';

interface DraggableCardProps {
  children: React.ReactNode;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
}

const DraggableCard: React.FC<DraggableCardProps> = ({
  children,
  onClose,
  initialPosition = {
    x: window.innerWidth / 2 - 191,
    y: window.innerHeight / 2 - 191,
  },
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep card within viewport bounds
      const maxX = window.innerWidth - 382;
      const maxY = window.innerHeight - 382;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <GlassSurface
      width={382}
      height={382}
      borderRadius={42}
      borderWidth={0}
      brightness={50}
      opacity={0.93}
      blur={40}
      displace={0.7}
      backgroundOpacity={0.04}
      saturation={1.5}
      distortionScale={-180}
      redOffset={0}
      greenOffset={10}
      blueOffset={20}
      className="draggable-card"
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        zIndex: 999999,
        transition: isDragging ? "none" : "all 0.2s ease",
      }}
    >
      <div
        ref={cardRef}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "center",
          padding: "24px",
          position: "relative",
        }}
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            playClickSound();
            onClose();
          }}
          style={{
            position: "absolute",
            top: "15px",
            right: "20px",
            background: "none",
            border: "none",
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "20px",
            cursor: "pointer",
            padding: "5px",
            borderRadius: "50%",
            transition: "color 0.2s ease",
            zIndex: 20000,
            pointerEvents: "auto",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
          }}
        >
          ×
        </button>
        {children}
      </div>
    </GlassSurface>
  );
};

interface AboutSectionProps {
  isVisible: boolean;
  onClose?: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  isVisible,
  onClose,
}) => {
  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(-20px)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none',
        visibility: isVisible ? 'visible' : 'hidden'
      }}
    >
      <DraggableCard onClose={onClose || (() => {})}>
        <div className="text-center" style={{ paddingTop: "60px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "400",
            color: "white",
            margin: "0 0 16px 0",
            fontFamily: "Helvetica, Arial, sans-serif",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            lineHeight: "1.2",
            position: "absolute",
            top: "24px",
            left: "24px",
            right: "24px",
          }}
        >
          About Us
        </h2>
        <p
          style={{
            fontSize: "12px",
            lineHeight: "1.5",
            color: "rgba(255, 255, 255, 0.9)",
            textAlign: "center",
            fontFamily: "Helvetica, Arial, sans-serif",
            fontWeight: "400",
          }}
        >
          Oh builds immersive environments for commerce and culture. We replace
          static websites with spatial systems powered by Unreal Engine, AI, and
          cloud infrastructure. Our work spans both digital and physical domains
          and is built to scale with the future of interaction.
        </p>
        </div>
      </DraggableCard>
    </div>
  );
};

interface ContactSectionProps {
  isVisible: boolean;
  onClose?: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  isVisible,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      alert('Please enter your email');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          message: formData.message,
          subject: 'New Contact Form Submission from OH Web'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus('success');
        setFormData({ name: '', phone: '', email: '', message: '' });
        playClickSound();
        
        setTimeout(() => {
          setSubmitStatus('idle');
          if (onClose) onClose();
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(-20px)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none',
        visibility: isVisible ? 'visible' : 'hidden'
      }}
    >
      <DraggableCard
        onClose={onClose || (() => {})}
        initialPosition={{
          x: window.innerWidth / 2 - 191 + 50,
          y: window.innerHeight / 2 - 191 + 50,
        }}
      >
      <div style={{ paddingTop: "60px" }}>
        <h2
          id="contact-form-title"
          style={{
            fontSize: "20px",
            fontWeight: "400",
            color: "white",
            margin: "0 0 16px 0",
            fontFamily: "Helvetica, Arial, sans-serif",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            lineHeight: "1.2",
            position: "absolute",
            top: "24px",
            left: "24px",
            right: "24px",
          }}
        >
          Contact Us
        </h2>
        <style>{`
          .contact-form input::placeholder,
          .contact-form textarea::placeholder {
            color: white !important;
            opacity: 1;
          }
          .contact-form input::-webkit-input-placeholder,
          .contact-form textarea::-webkit-input-placeholder {
            color: white !important;
          }
          .contact-form input::-moz-placeholder,
          .contact-form textarea::-moz-placeholder {
            color: white !important;
            opacity: 1;
          }
          .contact-form input:focus,
          .contact-form textarea:focus {
            border-color: rgba(255, 255, 255, 0.8);
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
          }
        `}</style>
        <form
          onSubmit={handleSubmit}
          className="contact-form"
          aria-labelledby="contact-form-title"
          noValidate
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <input
              type="text"
              name="name"
              id="contact-name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-label="Your name"
              autoComplete="name"
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "20px",
                border: "1px solid white",
                backgroundColor: "transparent",
                color: "white",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                opacity: isSubmitting ? 0.5 : 1,
              }}
            />
            <input
              type="tel"
              name="phone"
              id="contact-phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-label="Your phone number"
              autoComplete="tel"
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "20px",
                border: "1px solid white",
                backgroundColor: "transparent",
                color: "white",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                opacity: isSubmitting ? 0.5 : 1,
              }}
            />
            <input
              type="email"
              name="email"
              id="contact-email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              required
              aria-label="Your email address"
              aria-required="true"
              autoComplete="email"
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "20px",
                border: "1px solid white",
                backgroundColor: "transparent",
                color: "white",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                opacity: isSubmitting ? 0.5 : 1,
              }}
            />
            <textarea
              name="message"
              id="contact-message"
              placeholder="Message"
              rows={3}
              value={formData.message}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-label="Your message"
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "20px",
                border: "1px solid white",
                backgroundColor: "transparent",
                color: "white",
                outline: "none",
                resize: "vertical",
                minHeight: "60px",
                width: "100%",
                boxSizing: "border-box",
                opacity: isSubmitting ? 0.5 : 1,
              }}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              aria-label={isSubmitting ? 'Sending message...' : 'Send message'}
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: "12px",
                fontWeight: "400",
                padding: "10px 24px",
                borderRadius: "20px",
                border: "1px solid white",
                backgroundColor: submitStatus === 'success' ? 'rgba(0, 255, 0, 0.2)' : submitStatus === 'error' ? 'rgba(255, 0, 0, 0.2)' : "transparent",
                color: "white",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                marginTop: "8px",
                width: "100%",
                boxSizing: "border-box",
                textAlign: "left",
                opacity: isSubmitting ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting && submitStatus === 'idle') {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {isSubmitting ? 'Sending...' : submitStatus === 'success' ? 'Sent!' : submitStatus === 'error' ? 'Error - Try Again' : 'Send'}
            </button>
            {submitStatus === 'success' && (
              <p role="status" aria-live="polite" style={{ color: 'rgba(0, 255, 0, 0.8)', fontSize: '11px', margin: '4px 0 0 0', textAlign: 'center' }}>
                Message sent successfully!
              </p>
            )}
            {submitStatus === 'error' && (
              <p role="alert" aria-live="assertive" style={{ color: 'rgba(255, 0, 0, 0.8)', fontSize: '11px', margin: '4px 0 0 0', textAlign: 'center' }}>
                Failed to send. Please try again.
              </p>
            )}
          </div>
        </form>
      </div>
      </DraggableCard>
    </div>
  );
};

interface PrivacySectionProps {
  isVisible: boolean;
  onClose?: () => void;
}

export const PrivacySection: React.FC<PrivacySectionProps> = ({
  isVisible,
  onClose,
}) => {
  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(-20px)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none',
        visibility: isVisible ? 'visible' : 'hidden'
      }}
    >
      <DraggableCard onClose={onClose || (() => {})}>
        <div style={{ paddingTop: "60px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "400",
              color: "white",
              margin: "0 0 16px 0",
              fontFamily: "Helvetica, Arial, sans-serif",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              lineHeight: "1.2",
              position: "absolute",
              top: "24px",
              left: "24px",
              right: "24px",
            }}
          >
            Privacy Policy
          </h2>
          <div
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: "12px",
              fontWeight: "400",
              color: "rgba(255, 255, 255, 0.9)",
              lineHeight: "1.6",
              maxHeight: "280px",
              overflowY: "auto",
              paddingRight: "8px",
            }}
          >
            <p style={{ marginBottom: "16px" }}>
              <strong>Last Updated:</strong> December 11, 2025
            </p>
            
            <p style={{ marginBottom: "16px" }}>
              OH Systems ("OH", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
            </p>

            <h3 style={{ fontWeight: "600", marginTop: "16px", marginBottom: "8px" }}>Information We Collect</h3>
            <p style={{ marginBottom: "16px" }}>
              We collect information that you provide directly to us, including name, email address, phone number, and any messages you send through our contact forms. We also automatically collect certain information about your device and how you interact with our services.
            </p>

            <h3 style={{ fontWeight: "600", marginTop: "16px", marginBottom: "8px" }}>How We Use Your Information</h3>
            <p style={{ marginBottom: "16px" }}>
              We use the information we collect to provide, maintain, and improve our services, to communicate with you, to respond to your inquiries, and to send you technical notices and support messages.
            </p>

            <h3 style={{ fontWeight: "600", marginTop: "16px", marginBottom: "8px" }}>Data Security</h3>
            <p style={{ marginBottom: "16px" }}>
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
            </p>

            <h3 style={{ fontWeight: "600", marginTop: "16px", marginBottom: "8px" }}>Contact Us</h3>
            <p style={{ marginBottom: "0" }}>
              If you have questions about this Privacy Policy, please contact us through our website contact form.
            </p>
          </div>
        </div>
      </DraggableCard>
    </div>
  );
};

interface TermsSectionProps {
  isVisible: boolean;
  onClose?: () => void;
}

export const TermsSection: React.FC<TermsSectionProps> = ({
  isVisible,
  onClose,
}) => {
  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(-20px)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        pointerEvents: isVisible ? 'auto' : 'none',
        visibility: isVisible ? 'visible' : 'hidden'
      }}
    >
      <DraggableCard onClose={onClose || (() => {})}>
        <div style={{ paddingTop: "60px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "400",
              color: "white",
              margin: "0 0 16px 0",
              fontFamily: "Helvetica, Arial, sans-serif",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              lineHeight: "1.2",
              position: "absolute",
              top: "24px",
              left: "24px",
              right: "24px",
            }}
          >
            Terms and Conditions
          </h2>
          <div
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: "12px",
              fontWeight: "400",
              color: "rgba(255, 255, 255, 0.9)",
              lineHeight: "1.6",
              maxHeight: "280px",
              overflowY: "auto",
              paddingRight: "8px",
            }}
          >
            <p style={{ marginBottom: "16px" }}>
              <strong>Last Updated:</strong> December 11, 2025
            </p>
            
            <p style={{ marginBottom: "16px" }}>
              These Terms and Conditions ("Terms") govern your use of the OH Systems website and services. By accessing or using our services, you agree to be bound by these Terms.
            </p>

            <h3 style={{ fontWeight: "600", marginTop: "16px", marginBottom: "8px" }}>Use of Services</h3>
            <p style={{ marginBottom: "16px" }}>
              You may use our services only in compliance with these Terms and all applicable laws. You are responsible for your use of the services and for any consequences thereof.
            </p>

            <h3 style={{ fontWeight: "600", marginTop: "16px", marginBottom: "8px" }}>Intellectual Property</h3>
            <p style={{ marginBottom: "16px" }}>
              All content, features, and functionality of our services are owned by OH Systems and are protected by international copyright, trademark, and other intellectual property laws.
            </p>

            <h3 style={{ fontWeight: "600", marginTop: "16px", marginBottom: "8px" }}>Limitation of Liability</h3>
            <p style={{ marginBottom: "16px" }}>
              To the fullest extent permitted by law, OH Systems shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.
            </p>

            <h3 style={{ fontWeight: "600", marginTop: "16px", marginBottom: "8px" }}>Changes to Terms</h3>
            <p style={{ marginBottom: "16px" }}>
              We reserve the right to modify these Terms at any time. Your continued use of our services after any such changes constitutes your acceptance of the new Terms.
            </p>

            <h3 style={{ fontWeight: "600", marginTop: "16px", marginBottom: "8px" }}>Contact Information</h3>
            <p style={{ marginBottom: "0" }}>
              For questions about these Terms, please contact us through our website contact form.
            </p>
          </div>
        </div>
      </DraggableCard>
    </div>
  );
};

export function GlassSections({
  showAbout,
  showContact,
  showPrivacy,
  showTerms,
  onAboutClose,
  onContactClose,
  onPrivacyClose,
  onTermsClose,
}: {
  showAbout: boolean;
  showContact: boolean;
  showPrivacy: boolean;
  showTerms: boolean;
  onAboutClose: () => void;
  onContactClose: () => void;
  onPrivacyClose: () => void;
  onTermsClose: () => void;
}) {
  return (
    <>
      <AboutSection isVisible={showAbout} onClose={onAboutClose} />
      <ContactSection isVisible={showContact} onClose={onContactClose} />
      <PrivacySection isVisible={showPrivacy} onClose={onPrivacyClose} />
      <TermsSection isVisible={showTerms} onClose={onTermsClose} />
    </>
  );
}
