# Gerador de boletos bancarios

## Instalação

```bash
npm install brazilian-boletos
```

### Como utilizar em TS:

```typescript
import { BoletoGenerator, Banco } from "brazilian-boletos";

const boletoGenerator = new BoletoGenerator({
  banco: Banco.BRADESCO,
  pagador: {
    nome: "Nome",
    cpfCnpj: "123.456.789-00",
    endereco: "Rua das Dividas, 123",
    bairro: "Centro",
    cidade: "São Paulo",
    uf: "SP",
    cep: "01234-567",
  },
  beneficiario: {
    nome: "Empresa XYZ Ltda",
    cpfCnpj: "12.345.678/0001-90",
    endereco: "Avenida Paulista, 1000",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP",
    cep: "01310-100",
    agencia: "1234",
    conta: "56789-0",
    carteira: "9",
  },
  boleto: {
    nossoNumero: "00123456789",
    numeroDocumento: "12345",
    dataVencimento: new Date(),
    dataEmissao: new Date(),
    valor: 1299.99,
    especieDocumento: "DM",
    instrucoes: [
      "Não receber após o vencimento",
      "Juros de 1% ao mês",
      "Multa de 2% após o vencimento",
      "Pagável em qualquer agência bancária até o vencimento",
    ],
  },
});

// Gera um buffer do PDF do boleto
const buffer = await boletoGenerator.gerarPDFBuffer();

/**
 * Gera o PDF do boleto e retorna o path do arquivo
 * Caso seja necessário, pode-se passar o caminho do arquivo como parametro 2° exemplo
 */
await boletoGenerator.gerarPDFFile();
await boletoGenerator.gerarPDFFile("caminho/do/arquivo.pdf");
```

Biblioteca criada por [@ViniciusSoares-Developer](https://github.com/ViniciusSoares-Developer)

Ainda em processo de desenvolvimento, mas já funcional.
