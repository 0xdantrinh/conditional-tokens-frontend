const Web3 = require('web3');
const config = require('./src/conf/config.local.json');

const web3 = new Web3('https://sepolia.base.org');

const ConditionalTokensABI = require('./src/abi/ConditionalTokens.json').abi;

async function checkConditions() {
  const ct = new web3.eth.Contract(ConditionalTokensABI, config.contracts.conditionalTokens);
  
  console.log('Checking conditions for all markets...\n');
  
  for (const market of config.markets) {
    console.log(`Market: ${market.title}`);
    console.log(`  QuestionId: ${market.questionId}`);
    console.log(`  ConditionId: ${market.conditionId}`);
    
    try {
      const payoutDenominator = await ct.methods.payoutDenominator(market.conditionId).call();
      console.log(`  PayoutDenominator: ${payoutDenominator}`);
      
      if (payoutDenominator === '0') {
        console.log('  ❌ NOT PREPARED');
      } else {
        console.log('  ✅ PREPARED');
        
        // Check payout numerators
        for (let i = 0; i < market.outcomeSlotCount; i++) {
          const numerator = await ct.methods.payoutNumerators(market.conditionId, i).call();
          console.log(`    Outcome ${i} numerator: ${numerator}`);
        }
      }
    } catch (err) {
      console.log(`  ❌ ERROR: ${err.message}`);
    }
    console.log('');
  }
}

checkConditions().catch(console.error);
