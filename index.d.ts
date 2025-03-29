declare module "brazilian-boletos" {
  export enum Banco {
    BANCO_DO_BRASIL = "001",
    BRADESCO = "237",
  }

  export const Carteiras: {
    [key: string]: string[];
  };

  export interface BoletoInterface {
    banco: {
      codigo: Banco;
      nome: string;
      agencia: string;
      conta: string;
      carteira: string;
      convenio?: string;
    };
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
    };
    boleto: {
      nossoNumero: string;
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

    async gerarPDFFile(outpath?: string): Promise<string>;

    async gerarPDFBuffer(): Promise<Buffer>;
  }
}
