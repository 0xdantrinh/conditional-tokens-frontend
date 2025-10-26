const Web3 = require('web3');
const config = require('./src/conf/config.local.json');

const web3 = new Web3('https://sepolia.base.org');

const LMSRMarketMakerABI = require('./src/abi/LMSRMarketMaker.json').abi;

async function checkLMSR() {
  const lmsrAddress = config.lmsrMarketMakers['0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'];
  console.log('Checking LMSR at:', lmsrAddress);
  console.log('');
  
  const lmsr = new web3.eth.Contract(LMSRMarketMakerABI, lmsrAddress);
  
  try {
    const funding = await lmsr.methods.funding().call();
    console.log('Funding:', funding);
    
    const stage = await lmsr.methods.stage().call();
    console.log('Stage:', stage, '(0=Running, 1=Paused, 2=Closed)');
    
    const owner = await lmsr.methods.owner().call();
    console.log('Owner:', owner);
    
    const atomicOutcomeSlotCount = await lmsr.methods.atomicOutcomeSlotCount().call();
    console.log('AtomicOutcomeSlotCount:', atomicOutcomeSlotCount);
    
    const pmSystem = await lmsr.methods.pmSystem().call();
    console.log('PM System:', pmSystem);
    
    const collateralToken = await lmsr.methods.collateralToken().call();
    console.log('Collateral Token:', collateralToken);
    
    console.log('\nTrying to get marginal price for outcome 0...');
    const price = await lmsr.methods.calcMarginalPrice(0).call();
    console.log('✅ Price:', price);
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

checkLMSR().catch(console.error);
