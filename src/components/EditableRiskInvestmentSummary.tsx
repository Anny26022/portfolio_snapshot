import React, { useState } from 'react';

  interface EditableRiskInvestmentSummaryProps {
    data: {
      totalOpenRisk: number;
      totalInvested: number;
    };
    onDataChange: (newData: {
      totalOpenRisk: number;
      totalInvested: number;
    }) => void;
  }

  const EditableRiskInvestmentSummary: React.FC<EditableRiskInvestmentSummaryProps> = ({ data, onDataChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
      totalOpenRisk: data.totalOpenRisk,
      totalInvested: data.totalInvested
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setEditData({
        ...editData,
        [name]: type === 'checkbox' ? checked : parseFloat(value)
      });
    };
    
    const handleSave = () => {
      onDataChange(editData);
      setIsEditing(false);
    };
    
    const handleCancel = () => {
      setEditData({
        totalOpenRisk: data.totalOpenRisk,
        totalInvested: data.totalInvested
      });
      setIsEditing(false);
    };
    
    // Function to determine text color based on value
    const getTextColor = (value: number) => {
      if (value > 0) return 'text-green-600';
      if (value < 0) return 'text-red-600';
      return 'text-gray-800';
    };
    
    return (
      <></>
    );
};

export default EditableRiskInvestmentSummary;
