import React, { useState, useEffect } from 'react';
import './ApplicationForm.css';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { saveAs } from 'file-saver';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdfjs-dist/${pdfjsLib.version}/pdf.worker.min.js`;

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
        const response = await fetch('/api/ledger');
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

    // Check if a resume file is uploaded
    if (!formData.resume) {
      console.error('No resume file uploaded');
      return;
    }

    const file = formData.resume;

    // Extract text from the resume
    let text = '';
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map(item => item.str).join(' ') + ' ';
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    } else {
      alert('Unsupported file type. Please upload a PDF or DOCX file.');
      return;
    }

    // Tokenize the text
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(word => word.length > 0);
    const tokenObject = {};
    words.forEach(word => {
      tokenObject[word] = true;
    });

    // Save tokens to token.txt on server
    try {
      await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokens: tokenObject }),
      });
      console.log('Tokens saved to token.txt');
    } catch (error) {
      console.error('Error saving tokens:', error);
    }

    try {
      // Step 1: Read the uploaded resume file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Step 2: Generate a SHA-256 hash of the file contents
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);

      // Convert the hash buffer to a hexadecimal string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const resume_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Step 3: Store the generated hash in a variable called resume_hash (already done above)

      // Step 4: Log the hash to the console for verification
      console.log('Resume hash:', resume_hash);

      // Create ledger entry
      const application_id = crypto.randomUUID(); // Generate a unique application ID
      const timestamp = new Date().toISOString(); // Get current timestamp in ISO format
      const entry = { application_id, resume_hash, timestamp };

      // Log all values for debugging
      console.log('Application ID:', application_id);
      console.log('Resume Hash:', resume_hash);
      console.log('Timestamp:', timestamp);

      // Send the ledger entry to the server
      try {
        const response = await fetch('/api/ledger', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }
        console.log('Ledger entry saved');
      } catch (error) {
        console.error('Error saving to ledger:', error);
        alert(`Failed to save application: ${error.message}`);
        return;
      }

      // Refresh the ledger from server
      try {
        const ledgerResponse = await fetch('/api/ledger');
        if (ledgerResponse.ok) {
          const data = await ledgerResponse.json();
          setLedger(data);
        }
      } catch (error) {
        console.error('Error refreshing ledger:', error);
      }

      // In a real app, send data to server including the hash
      console.log('Form submitted:', formData);
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error processing resume file:', error);
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
            required
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
            required
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
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="qualification">Highest Qualification</label>
          <select
            id="qualification"
            name="qualification"
            value={formData.qualification}
            onChange={handleChange}
            required
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
            required
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
            required
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
                required
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