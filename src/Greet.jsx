import React, { useCallback, useEffect, useState } from 'react';
import { VStack, HStack, Button, Input } from '@chakra-ui/react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FormControl, FormLabel } from '@chakra-ui/react';
import * as borsh from 'borsh';
import {
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';

const programId = new PublicKey('FGbjtxeYmT5jUP7aNavo9k9mQ3rGQ815WdvwWndR7FF9');
const GREETING_SEED = 'hello';

class GreetingAccount {
  counter = 0;
  constructor(fields) {
    if (fields) {
      this.counter = fields.counter;
    }
  }
}

const GreetingSchema = new Map([
  [GreetingAccount, { kind: 'struct', fields: [['counter', 'u32']] }],
]);

const GREETING_SIZE = borsh.serialize(
  GreetingSchema,
  new GreetingAccount()
).length;

function counterFromAccountInfo(accountInfo) {
  const data = borsh.deserialize(
    GreetingSchema,
    GreetingAccount,
    accountInfo.data
  );
  return data.counter;
}

export function Greet() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [counter, setCounter] = useState(null);

  const greet = useCallback(
    async publicKey => {
      const recipient = new PublicKey(publicKey);
      const greetedPubkey = await PublicKey.createWithSeed(
        recipient,
        GREETING_SEED,
        programId
      );

      const greetedAccount = await connection.getAccountInfo(greetedPubkey);
      if (greetedAccount === null) {
        const lamports = await connection.getMinimumBalanceForRentExemption(
          GREETING_SIZE
        );

        const transaction = new Transaction().add(
          SystemProgram.createAccountWithSeed({
            fromPubkey: recipient,
            basePubkey: recipient,
            seed: GREETING_SEED,
            newAccountPubkey: greetedPubkey,
            lamports,
            space: GREETING_SIZE,
            programId,
          })
        );

        const signature = await wallet.sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, 'processed');
      }

      const instruction = new TransactionInstruction({
        keys: [{ pubkey: greetedPubkey, isSigner: false, isWritable: true }],
        programId,
        data: Buffer.alloc(0),
      });

      const signature = await wallet.sendTransaction(
        new Transaction().add(instruction),
        connection
      );

      await connection.confirmTransaction(signature, 'processed');
    },
    [connection, wallet]
  );

  const greetYourself = useCallback(async () => {
    await greet(wallet.publicKey.toBase58());
  }, [greet, wallet.publicKey]);

  useEffect(() => {
    async function addListener() {
      if (wallet.publicKey) {
        const greetedPubkey = await PublicKey.createWithSeed(
          wallet.publicKey,
          GREETING_SEED,
          programId
        );
        const currentAccountInfo = await connection.getAccountInfo(
          greetedPubkey,
          'confirmed'
        );
        if (currentAccountInfo === null) {
          setCounter(0);
        } else {
          setCounter(counterFromAccountInfo(currentAccountInfo));
        }
        connection.onAccountChange(
          greetedPubkey,
          (accountInfo, _) => {
            setCounter(counterFromAccountInfo(accountInfo));
          },
          'confirmed'
        );
      }
    }
    addListener();
  }, [connection, wallet.publicKey]);

  const [recipient, setRecipient] = useState('');
  return (
    <>
      <VStack width="full" spacing={8} borderRadius={10} borderWidth={2} p={10}>
        <FormControl id="greetings">
          <FormLabel>No. of greetings recieved</FormLabel>
          <Input
            type="text"
            value={counter === null ? 'Loading..' : counter}
            readOnly
          />
        </FormControl>
        <HStack>
          <Button onClick={greetYourself}>Greet Yourself</Button>
        </HStack>
      </VStack>
      <VStack width="full" spacing={8} borderRadius={10} borderWidth={2} p={10}>
        <FormControl id="send">
          <FormLabel>Send greeting to public key</FormLabel>
          <Input
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
          ></Input>
        </FormControl>
        <Button
          onClick={() => {
            greet(recipient);
          }}
        >
          Greet
        </Button>
      </VStack>
    </>
  );
}
