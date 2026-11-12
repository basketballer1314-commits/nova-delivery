// Abstraction d'envoi de SMS. Permet de brancher plus tard un agrégateur
// local (sénégalais) sans toucher au reste de la fonction.

export interface SmsProvider {
  send(phone: string, message: string): Promise<void>
}

// Implémentation de dev : n'envoie rien, loggue dans la console des functions.
export class ConsoleSmsProvider implements SmsProvider {
  async send(phone: string, message: string): Promise<void> {
    console.log(`[send-sms][console] → ${phone} : ${message}`)
  }
}

// Implémentation agrégateur local — à remplir plus tard (HTTP vers le fournisseur).
export class LocalAggregatorSmsProvider implements SmsProvider {
  constructor(private readonly apiKey: string, private readonly endpoint: string) {}

  async send(_phone: string, _message: string): Promise<void> {
    // TODO: POST vers l'agrégateur local (ex. Axes/InTouch) avec this.endpoint.
    throw new Error('LocalAggregatorSmsProvider.send non implémenté')
  }
}

// Sélection du provider selon l'environnement.
export function getSmsProvider(): SmsProvider {
  const provider = Deno.env.get('SMS_PROVIDER') ?? 'console'
  if (provider === 'aggregator') {
    return new LocalAggregatorSmsProvider(
      Deno.env.get('SMS_AGGREGATOR_KEY') ?? '',
      Deno.env.get('SMS_AGGREGATOR_URL') ?? '',
    )
  }
  return new ConsoleSmsProvider()
}
