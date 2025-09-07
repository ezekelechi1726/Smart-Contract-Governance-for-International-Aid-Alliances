# 🌍 Smart Contract Governance for International Aid Alliances

Welcome to a transparent and enforceable system for managing international aid alliances on the blockchain! This project uses smart contracts on the Stacks blockchain (written in Clarity) to enforce agreements between donors, recipients, and oversight organizations. By making terms immutable, it reduces corruption, ensures accountability, and automates fund distribution based on verifiable milestones—solving real-world issues like mismanagement and lack of trust in global aid efforts.

## ✨ Features
🔒 Immutable agreement terms stored on-chain  
💰 Automated fund disbursement upon milestone verification  
📊 Transparent tracking of aid usage and outcomes  
🤝 Multi-party governance with voting for amendments  
🛡️ Dispute resolution through oracle-integrated arbitration  
📈 Reporting and auditing tools for stakeholders  
🚫 Prevention of fund misuse via conditional releases  
✅ Integration with real-world data oracles for milestone proofs  

## 🛠 How It Works
This system involves a network of 8 interconnected smart contracts to handle various aspects of aid governance. All contracts are written in Clarity for security and predictability on the Stacks blockchain.

**For Donors (e.g., Governments or NGOs)**  
- Propose an aid alliance by deploying an agreement with terms, funding amounts, and milestones.  
- Fund the alliance escrow using the `deposit-funds` function in the EscrowContract.  
- Monitor progress via the ReportingContract and vote on disputes if needed.

**For Recipients (e.g., Aid-Receiving Organizations)**  
- Accept alliance terms by signing on-chain via the AgreementContract.  
- Submit proof of milestones (e.g., via oracles) to trigger fund releases from the MilestoneContract.  
- Report usage through the TrackingContract to maintain transparency.

**For Overseers (e.g., Independent Auditors)**  
- Verify submitted proofs using the OracleContract.  
- Initiate votes on amendments or disputes in the GovernanceContract.  
- Access immutable audit logs from the AuditContract for compliance checks.

Once an alliance is formed, funds are locked in escrow and only released when conditions are met—ensuring no single party can alter terms or siphon funds. Disputes are resolved via majority vote among verified stakeholders, with all actions timestamped and auditable.

## 📂 Smart Contracts Overview
The project is built around 8 smart contracts, each handling a specific function to create a robust, modular system:

1. **AgreementContract**: Defines and stores immutable alliance terms, including parties, goals, and conditions. Functions: `create-agreement`, `sign-agreement`.  
2. **EscrowContract**: Manages fund deposits and conditional releases. Functions: `deposit-funds`, `release-funds`.  
3. **MilestoneContract**: Tracks project milestones and verifies completions. Functions: `submit-milestone-proof`, `verify-milestone`.  
4. **GovernanceContract**: Handles voting for amendments or disputes among stakeholders. Functions: `propose-vote`, `cast-vote`.  
5. **OracleContract**: Integrates external data sources for real-world verification (e.g., API feeds for progress reports). Functions: `submit-oracle-data`, `query-oracle`.  
6. **TrackingContract**: Logs aid usage and transactions for transparency. Functions: `log-usage`, `query-transactions`.  
7. **AuditContract**: Provides immutable audit trails and reporting. Functions: `generate-report`, `access-logs`.  
8. **DisputeContract**: Manages arbitration processes tied to governance votes. Functions: `initiate-dispute`, `resolve-dispute`.  

These contracts interact seamlessly (e.g., MilestoneContract calls EscrowContract for releases), ensuring the system is secure, scalable, and enforceable. Deploy them on Stacks for production use!