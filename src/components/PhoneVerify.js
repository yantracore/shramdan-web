"use client";

// Optional phone verification card for /me. "Verify phone" sends an SMS OTP
// (POST /auth/phone/send-otp); a modal collects the 6-digit code
// (POST /auth/phone/verify). 503 means SMS is unavailable on the backend —
// surfaced as a soft notice, not a hard error. On success the parent refreshes
// the profile (onVerified) so the verified state flips.

import { CheckCircleFilled, SafetyOutlined } from "@ant-design/icons";
import { Button, Input, Modal } from "antd";
import { useState } from "react";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/apiClient";
import { useToast } from "@/lib/toast";

const COPY = {
  np: {
    heading: "फोन नम्बर पुष्टि",
    intro: "तपाईंको नम्बर ({phone}) मा SMS कोड पठाएर पुष्टि गर्नुहोस् — वैकल्पिक।",
    sendCta: "कोड पठाउनुहोस्",
    modalTitle: "फोन पुष्टि गर्नुहोस्",
    modalIntro: "{phone} मा पठाइएको ६ अंकको कोड हाल्नुहोस्।",
    verifyCta: "पुष्टि गर्नुहोस्",
    alreadyVerified: "तपाईंको फोन नम्बर पुष्टि भइसकेको छ।",
    sent: "SMS कोड पठाइयो।",
    verified: "फोन नम्बर पुष्टि भयो।",
    otpInvalid: "६ अंकको कोड हाल्नुहोस्।",
    smsUnavailable: "अहिले SMS सेवा उपलब्ध छैन। पछि प्रयास गर्नुहोस्।",
    error: "केही गडबड भयो। फेरि प्रयास गर्नुहोस्।"
  },
  en: {
    heading: "Phone verification",
    intro: "Verify your number ({phone}) with an SMS code — optional.",
    sendCta: "Send code",
    modalTitle: "Verify your phone",
    modalIntro: "Enter the 6-digit code sent to {phone}.",
    verifyCta: "Verify",
    alreadyVerified: "Your phone number is verified.",
    sent: "SMS code sent.",
    verified: "Phone number verified.",
    otpInvalid: "Enter the 6-digit code.",
    smsUnavailable: "SMS service is unavailable right now. Try again later.",
    error: "Something went wrong. Please try again."
  }
};

export function PhoneVerify({ language = "np", phone, verified = false, onVerified }) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Nothing to verify without a number on file.
  if (!phone) return null;

  if (verified) {
    return (
      <div className="content-card me-phone-verify-card">
        <div className="me-card-heading">
          <h2>
            <SafetyOutlined /> {t.heading}
          </h2>
        </div>
        <p className="me-phone-verified">
          <CheckCircleFilled /> {t.alreadyVerified}
        </p>
      </div>
    );
  }

  const handleSend = async () => {
    setSending(true);
    try {
      await sendPhoneOtp();
      setOtp("");
      setOpen(true);
      messageApi.success(t.sent);
    } catch (error) {
      if (error?.status === 503) messageApi.warning(t.smsUnavailable);
      else messageApi.error(error?.message || t.error);
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(otp)) {
      messageApi.error(t.otpInvalid);
      return;
    }
    setVerifying(true);
    try {
      await verifyPhoneOtp(otp.trim());
      messageApi.success(t.verified);
      setOpen(false);
      onVerified?.();
    } catch (error) {
      messageApi.error(error?.message || t.otpInvalid);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="content-card me-phone-verify-card">
      <div className="me-card-heading">
        <h2>
          <SafetyOutlined /> {t.heading}
        </h2>
        <p>{t.intro.replace("{phone}", phone)}</p>
      </div>
      <Button onClick={handleSend} loading={sending}>
        {t.sendCta}
      </Button>

      <Modal
        title={t.modalTitle}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleVerify}
        okText={t.verifyCta}
        confirmLoading={verifying}
      >
        <p className="me-phone-modal-intro">{t.modalIntro.replace("{phone}", phone)}</p>
        <Input
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onPressEnter={handleVerify}
          placeholder="••••••"
          className="signup-otp-input"
          autoComplete="one-time-code"
        />
      </Modal>
    </div>
  );
}
