/**
 * pages/Components/LP Comps/ReportForm.tsx
 * Interactive Bento-grid based form for reporting lost items, featuring 
 * categorized cards for metadata and image uploads.
 */

import React, { useRef, useState } from 'react';
import { Upload, Calendar, MapPin, Eye, Tag, FileText } from 'lucide-react';

interface FormData {
  category: string;
  appearance: string;
  images: File[];
  hiddenMetadata: string;
  location: string;
  dateTime: string;
}

const ReportForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    category: '',
    appearance: '',
    images: [],
    hiddenMetadata: '',
    location: '',
    dateTime: ''
  });
  
  const [activeField, setActiveField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Wallet', 'Bags', 'Books', 'ID Card', 'Documents', 
    'Electronics', 'Jewelry', 'Keys', 'Clothing', 'Other'
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleFieldClick = (fieldName: string) => {
    setActiveField(fieldName);
    if (fieldName === 'images') {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="report-form-container">
      <div className="report-bento-grid">
        
        {/* Category Selection - Top Left */}
        <div 
          className={`bento-card category-card ${activeField === 'category' ? 'active' : ''}`}
          onClick={() => handleFieldClick('category')}
        >
          <div className="card-header">
            <Tag className="card-icon" />
            <span className="card-label">Category</span>
          </div>
          <div className="card-content">
            {activeField === 'category' ? (
              <select 
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="form-select"
                autoFocus
                onBlur={() => setActiveField(null)}
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            ) : (
              <>
                <h3>Item Category</h3>
                <p>{formData.category || 'Click to select category'}</p>
              </>
            )}
          </div>
        </div>

        {/* Appearance - Top Right */}
        <div 
          className={`bento-card appearance-card ${activeField === 'appearance' ? 'active' : ''}`}
          onClick={() => handleFieldClick('appearance')}
        >
          <div className="card-header">
            <Eye className="card-icon" />
            <span className="card-label">Appearance</span>
          </div>
          <div className="card-content">
            {activeField === 'appearance' ? (
              <textarea
                value={formData.appearance}
                onChange={(e) => setFormData(prev => ({ ...prev, appearance: e.target.value }))}
                placeholder="Describe the color, design, brand, condition..."
                className="form-textarea"
                autoFocus
                onBlur={() => setActiveField(null)}
              />
            ) : (
              <>
                <h3>Color & Design</h3>
                <p>{formData.appearance || 'Click to describe appearance'}</p>
              </>
            )}
          </div>
        </div>

        {/* Image Upload - Large Left */}
        <div 
          className={`bento-card image-card large ${activeField === 'images' ? 'active' : ''}`}
          onClick={() => handleFieldClick('images')}
        >
          <div className="card-header">
            <Upload className="card-icon" />
            <span className="card-label">Images</span>
          </div>
          <div className="card-content image-content">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden-input"
            />
            {formData.images.length > 0 ? (
              <div className="image-grid">
                {formData.images.map((file, index) => (
                  <div key={index} className="image-preview">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Upload ${index + 1}`}
                      className="preview-img"
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="add-more" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={24} />
                  <span>Add More</span>
                </div>
              </div>
            ) : (
              <div className="upload-placeholder">
                <Upload size={48} />
                <h3>Upload Images</h3>
                <p>Click to select photos of the found item</p>
              </div>
            )}
          </div>
        </div>

        {/* Hidden Metadata - Bottom Left */}
        <div 
          className={`bento-card metadata-card wide ${activeField === 'metadata' ? 'active' : ''}`}
          onClick={() => handleFieldClick('metadata')}
        >
          <div className="card-header">
            <FileText className="card-icon" />
            <span className="card-label">Verification</span>
          </div>
          <div className="card-content">
            {activeField === 'metadata' ? (
              <textarea
                value={formData.hiddenMetadata}
                onChange={(e) => setFormData(prev => ({ ...prev, hiddenMetadata: e.target.value }))}
                placeholder="Enter details only the owner would know (serial numbers, contents, personal markings, etc.)"
                className="form-textarea"
                autoFocus
                onBlur={() => setActiveField(null)}
              />
            ) : (
              <>
                <h3>Hidden Metadata</h3>
                <p>{formData.hiddenMetadata || 'Click to add verification details'}</p>
              </>
            )}
          </div>
        </div>

        {/* Location - Bottom Center */}
        <div 
          className={`bento-card location-card ${activeField === 'location' ? 'active' : ''}`}
          onClick={() => handleFieldClick('location')}
        >
          <div className="card-header">
            <MapPin className="card-icon" />
            <span className="card-label">Location</span>
          </div>
          <div className="card-content">
            {activeField === 'location' ? (
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Library Block A, Cafeteria..."
                className="form-input"
                autoFocus
                onBlur={() => setActiveField(null)}
              />
            ) : (
              <>
                <h3>Found Location</h3>
                <p>{formData.location || 'Click to add location'}</p>
              </>
            )}
          </div>
        </div>

        {/* Date & Time - Bottom Right */}
        <div 
          className={`bento-card datetime-card ${activeField === 'datetime' ? 'active' : ''}`}
          onClick={() => handleFieldClick('datetime')}
        >
          <div className="card-header">
            <Calendar className="card-icon" />
            <span className="card-label">Date & Time</span>
          </div>
          <div className="card-content">
            {activeField === 'datetime' ? (
              <input
                type="datetime-local"
                value={formData.dateTime}
                onChange={(e) => setFormData(prev => ({ ...prev, dateTime: e.target.value }))}
                className="form-input"
                autoFocus
                onBlur={() => setActiveField(null)}
              />
            ) : (
              <>
                <h3>When Found</h3>
                <p>{formData.dateTime ? new Date(formData.dateTime).toLocaleString() : 'Click to set date & time'}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="submit-section">
        <button 
          className="submit-btn"
          onClick={() => console.log('Form Data:', formData)}
        >
          Submit Report
        </button>
      </div>
    </div>
  );
};

export default ReportForm;