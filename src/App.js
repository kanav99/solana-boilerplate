import React, { useEffect, useState } from 'react';
import {
  ChakraProvider,
  Box,
  Text,
  VStack,
  Grid,
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
          </VStack>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App;
