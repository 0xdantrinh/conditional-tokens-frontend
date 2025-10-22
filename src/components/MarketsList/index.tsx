import React, { useState } from 'react'
import { Paper, Tabs, Tab, Chip, Box } from '@material-ui/core'
import Market from '../Market'
import styles from '../style.module.css'

const config = require('src/conf/config.local.json')

type MarketsListProps = {
  web3: any
  account: string
}

const MarketsList: React.FC<MarketsListProps> = ({ web3, account }) => {
  const [selectedMarketIndex, setSelectedMarketIndex] = useState<number>(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  // Get unique categories
  const uniqueCategories = new Set<string>()
  config.markets.forEach((m: any) => uniqueCategories.add(m.category))
  const categories: string[] = ['All', ...Array.from(uniqueCategories)]

  // Filter markets by category
  const filteredMarkets =
    selectedCategory === 'All'
      ? config.markets
      : config.markets.filter((m: any) => m.category === selectedCategory)

  return (
    <div className={styles.marketsContainer}>
      <Box style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {categories.map((category) => (
          <Chip
            key={category}
            label={category}
            onClick={() => {
              setSelectedCategory(category)
              setSelectedMarketIndex(0)
            }}
            color={selectedCategory === category ? 'primary' : 'default'}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </Box>

      <Paper style={{ marginBottom: '20px' }}>
        <Tabs
          value={selectedMarketIndex}
          onChange={(e, newValue) => setSelectedMarketIndex(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {filteredMarkets.map((market: any, index: number) => (
            <Tab
              key={market.questionId}
              label={
                <div style={{ textAlign: 'left', textTransform: 'none' }}>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>{market.category}</div>
                  <div style={{ fontSize: '14px' }}>{market.title}</div>
                </div>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {filteredMarkets[selectedMarketIndex] && (
        <Market
          key={filteredMarkets[selectedMarketIndex].questionId}
          web3={web3}
          account={account}
          marketConfig={filteredMarkets[selectedMarketIndex]}
        />
      )}
    </div>
  )
}

export default MarketsList
