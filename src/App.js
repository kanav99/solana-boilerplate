import React, { useCallback, useEffect, useState } from 'react';
import {
  ChakraProvider,
  Box,
  Text,
  VStack,
  Grid,
  Button,
  useToast,
  Code,
  HStack,
  Heading,
  theme,
} from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';

import * as web3 from '@solana/web3.js';

const connection = new web3.Connection(
  web3.clusterApiUrl('devnet'),
  'confirmed'
);

const pvkey = localStorage.getItem('pvkey');
var wallet;
if (pvkey === null) {
  wallet = web3.Keypair.generate();
  localStorage.setItem('pvkey', wallet.secretKey);
} else {
  let arr = new Uint8Array(pvkey.replace(/, +/g, ',').split(',').map(Number));
  wallet = web3.Keypair.fromSecretKey(arr);
}

function useSolanaAccount() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState(null);

  async function init() {
    let acc = await connection.getAccountInfo(wallet.publicKey);
    setAccount(acc);
    let transactions = await connection.getConfirmedSignaturesForAddress2(
      wallet.publicKey,
      {
        limit: 10,
      }
    );
    setTransactions(transactions);
  }

  useEffect(() => {
    setInterval(init, 1000);
  }, []);

  return { account, transactions };
}

function App() {
  const { account, transactions } = useSolanaAccount();
  const toast = useToast();
  const [airdropProcessing, setAirdropProcessing] = useState(false);

  const getAirdrop = useCallback(async () => {
    setAirdropProcessing(true);
    try {
      var airdropSignature = await connection.requestAirdrop(
        wallet.publicKey,
        web3.LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSignature);
    } catch (error) {
      toast({ title: 'Airdrop failed', description: error });
    }
    setAirdropProcessing(false);
  }, [toast]);

  return (
    <ChakraProvider theme={theme}>
      <Box textAlign="center" fontSize="xl">
        <Grid minH="100vh" p={3}>
          <ColorModeSwitcher justifySelf="flex-end" />
          <VStack spacing={8}>
            <Text>Wallet Public Key: {wallet.publicKey.toBase58()}</Text>
            <Text>
              Balance:{' '}
              {account
                ? account.lamports / web3.LAMPORTS_PER_SOL + ' SOL'
                : 'Loading..'}
            </Text>
            <Button onClick={getAirdrop} isLoading={airdropProcessing}>
              Get Airdrop of 1 SOL
            </Button>
            <Heading>Transactions</Heading>
            {transactions && (
              <VStack>
                {transactions.map((v, i, arr) => (
                  <HStack key={'transaction-' + i}>
                    <Text>Signature: </Text>
                    <Code>{v.signature}</Code>
                  </HStack>
                ))}
              </VStack>
            )}
          </VStack>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App;
