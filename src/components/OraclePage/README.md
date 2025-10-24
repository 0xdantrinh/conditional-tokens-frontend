# Oracle Management Page

This directory contains the UMA Oracle management interface for the prediction market.

## Components

### `index.tsx` - OraclePage

Main page component that displays all UMA Oracle questions.

**Features:**

- Lists all initialized questions from UmaCtfAdapter
- Filter by status (All, Pending, Ready, Resolved)
- Real-time updates every 30 seconds
- Click question to view details

**Props:**

- `web3: Web3` - Web3 instance
- `account: string` - Connected wallet address

### `QuestionDetailsModal.tsx`

Modal component showing detailed information about a question.

**Features:**

- Full question data and ancillary data
- Settlement information for resolved questions
- Liveness countdown for pending questions
- Resolve button when ready
- Transaction status and Basescan links

**Props:**

- `question: EnrichedQuestion` - Question data
- `account: string` - Connected wallet address
- `oracleRepo: UmaOracleRepo` - Repository instance
- `onClose: () => void` - Close handler
- `onResolved: () => void` - Resolution success handler

## Styling

- `style.module.css` - Main page styles
- `modal.module.css` - Modal component styles

## Usage

The Oracle page is accessible via the navigation menu in the main App component.

Navigate between "Markets" and "Oracle" pages using the nav buttons.
