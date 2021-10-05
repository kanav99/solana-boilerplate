import React, { useCallback, useEffect, useState } from 'react';
import {
  ChakraProvider,
  Box,
  Text,
  VStack,
  Grid,
  Button,
  useToast,
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

function App() {
  const [account, setAccount] = useState(null);
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
    let acc = await connection.getAccountInfo(wallet.publicKey);
    setAccount(acc);
    setAirdropProcessing(false);
  }, [toast]);

  useEffect(() => {
    async function init() {
      let acc = await connection.getAccountInfo(wallet.publicKey);
      setAccount(acc);
    }
    init();
  }, []);

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
          </VStack>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App;
