import React from 'react';
import { PortfolioData } from '../data/sampleData';

interface RiskInvestmentSummaryProps {
  data: PortfolioData;
}

const RiskInvestmentSummary: React.FC<RiskInvestmentSummaryProps> = ({ data }) => {
  const { totalOpenRisk, totalInvested } = data;
  
  return (
    <></>
  );
};

export default RiskInvestmentSummary;
