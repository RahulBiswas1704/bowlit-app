import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, message } = body;

    // Supabase sends a message like: "Your code is 123456. It expires in 5 minutes."
    // We need to extract the 6-digit code for Fast2SMS.
    const otpMatch = message.match(/\d{6}/);
    const otp = otpMatch ? otpMatch[0] : null;

    if (!otp) {
      return NextResponse.json({ error: 'OTP not found in message' }, { status: 400 });
    }

    // Clean phone number (remove +91 for Fast2SMS if necessary)
    const cleanPhone = phone.replace('+91', '').trim();

    // Fast2SMS API Call
    const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&numbers=${cleanPhone}`;

    const response = await fetch(fast2smsUrl, {
      method: 'GET',
    });

    const result = await response.json();

    if (result.return === true) {
      return NextResponse.json({ success: true });
    } else {
      console.error('Fast2SMS Error:', result);
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error('SMS API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
