import React, { useState, useEffect } from 'react';
import './ApplicationForm.css';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import { saveAs } from 'file-saver';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function ApplicationForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    qualification: '',
    experience: '',
    skills: '',
    gender: '',
    resume: null
  });
  const [ledger, setLedger] = useState([]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value
    });
  };

  // Load ledger from server on component mount
  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const response = await fetch('http://localhost:3001/ledger');
        if (response.ok) {
          const data = await response.json();
          setLedger(data);
        }
      } catch (error) {
        console.error('Error fetching ledger:', error);
      }
    };
    fetchLedger();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission started');

    // Validate form data
    if (!formData.fullName || !formData.email || !formData.phone || !formData.qualification || !formData.experience || !formData.skills || !formData.gender || !formData.resume) {
      alert('Please fill all required fields and upload a resume.');
      return;
    }

    const file = formData.resume;
    console.log('Resume file:', file.name, file.type);

    try {
      // Extract text from the resume
      let text = '';
      if (file.type === 'application/pdf') {
        console.log('Processing PDF');
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          text += textContent.items.map(item => item.str).join(' ') + ' ';
        }
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        console.log('Processing DOCX');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        alert('Unsupported file type. Please upload a PDF or DOCX file.');
        return;
      }
      console.log('Extracted text length:', text.length);

      // Tokenize the text
      const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(word => word.length > 0);
      const tokenObject = {};
      words.forEach(word => {
        tokenObject[word] = true;
      });
      console.log('Tokens generated:', Object.keys(tokenObject).length);

      // Save tokens to server
      const tokenResponse = await fetch('http://localhost:3001/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokens: tokenObject }),
      });
      if (!tokenResponse.ok) {
        throw new Error('Failed to save tokens');
      }
      console.log('Tokens saved successfully');

      // Generate SHA-256 hash of the resume
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const resume_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      console.log('Resume hash:', resume_hash);

      // Create ledger entry with full form data
      const application_id = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const entry = {
        application_id,
        resume_hash,
        timestamp,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        qualification: formData.qualification,
        experience: formData.experience,
        skills: formData.skills,
        gender: formData.gender
      };
      console.log('Ledger entry:', entry);

      // Send ledger entry to server
      const ledgerResponse = await fetch('http://localhost:3001/ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
      if (!ledgerResponse.ok) {
        const errorText = await ledgerResponse.text();
        throw new Error(`Failed to save to ledger: ${errorText}`);
      }
      console.log('Ledger entry saved successfully');

      // Refresh the ledger
      const refreshResponse = await fetch('http://localhost:3001/ledger');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setLedger(data);
      }

      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error during submission:', error);
      alert(`Submission failed: ${error.message}`);
    }
  };

  return (
    <div className="form-container">
      <h2>Application Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="qualification">Highest Qualification</label>
          <select
            id="qualification"
            name="qualification"
            value={formData.qualification}
            onChange={handleChange}
          >
            <option value="">Select Qualification</option>
            <option value="High School">High School</option>
            <option value="Associate Degree">Associate Degree</option>
            <option value="Bachelor's Degree">Bachelor's Degree</option>
            <option value="Master's Degree">Master's Degree</option>
            <option value="Doctorate">Doctorate</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="experience">Years of Experience</label>
          <input
            type="number"
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            min="0"
          />
        </div>
        <div className="form-group">
          <label htmlFor="skills">Skills</label>
          <textarea
            id="skills"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            rows="3"
            placeholder="List your skills, e.g., JavaScript, Python, etc."
          />
        </div>
        <div className="form-group">
          <label>Gender</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={formData.gender === 'Male'}
                onChange={handleChange}
              />
              Male
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={formData.gender === 'Female'}
                onChange={handleChange}
              />
              Female
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Other"
                checked={formData.gender === 'Other'}
                onChange={handleChange}
              />
              Other
            </label>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="resume">Resume Upload</label>
          <input
            type="file"
            id="resume"
            name="resume"
            onChange={handleChange}
            accept=".pdf,.doc,.docx"
            required
          />
        </div>
        <button type="submit" className="submit-btn">Submit Application</button>
      </form>

      {/* Mock Public Ledger Display */}
      <div className="ledger-section">
        <h3>Mock Public Ledger</h3>
        {ledger.length === 0 ? (
          <p>No entries yet.</p>
        ) : (
          <ul className="ledger-list">
            {ledger.map((entry, index) => (
              <li key={entry.application_id} className="ledger-entry">
                <strong>Application ID:</strong> {entry.application_id}<br />
                <strong>Resume Hash:</strong> {entry.resume_hash}<br />
                <strong>Timestamp:</strong> {new Date(entry.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ApplicationForm;