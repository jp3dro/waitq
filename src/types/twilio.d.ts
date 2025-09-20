declare module "twilio" {
  export interface TwilioMessagesApi {
    create(options: { to: string; body: string; messagingServiceSid: string }): Promise<unknown>;
  }

  export interface TwilioClient {
    messages: TwilioMessagesApi;
  }

  export default function twilio(accountSid: string, authToken: string): TwilioClient;
}


