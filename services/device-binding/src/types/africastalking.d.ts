// Type stubs for africastalking SDK
// Install the real package: npm i africastalking --save
declare module 'africastalking' {
  interface AfricasTalkingOptions { apiKey: string; username: string; }
  interface SendSmsOptions { to: string[]; message: string; from?: string; }
  interface SMSService { send(opts: SendSmsOptions): Promise<unknown>; }
  interface AfricasTalkingInstance { SMS: SMSService; }
  function AfricasTalking(opts: AfricasTalkingOptions): AfricasTalkingInstance;
  export = AfricasTalking;
}
