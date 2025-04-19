declare module "brazilian-boletos" {
  export type Banco = BancoDoBrasil | Bradesco;

  export interface BoletoInterface {
    banco: Banco;
    pagador: {
      nome: string;
      endereco: string;
      bairro: string;
      cidade: string;
      uf: string;
      cep: string;
    };
    beneficiario: {
      nome: string;
      cpfCnpj: string;
      endereco: string;
      bairro: string;
      cidade: string;
      uf: string;
      cep: string;
      agencia: string;
      conta: string;
      carteira: string;
    };
    boleto: {
      nossoNumero: string;
      linhaDigitavel?: string;
      numeroDocumento: string;
      dataVencimento: Date;
      dataEmissao: Date;
      valor: number;
      especieDocumento: string;
      instrucoes: Array<string>;
    };
  }

  export class BoletoGenerator {
    constructor(dados: BoletoInterface);

    gerarPDFFile(outpath?: string): Promise<string>;

    gerarPDFBuffer(): Promise<Buffer>;
  }
  class Bradesco {}
  class BancoDoBrasil {}
}
