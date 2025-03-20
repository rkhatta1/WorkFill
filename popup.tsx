import { useState, useEffect } from "react"
import type { Credentials } from "./storage"
import { defaultCredentials, getCredentials, saveCredentials } from "./storage"
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import "./styles.css"

const IndexPopup = () => {
  const [credentials, setCredentials] = useState<Credentials>(defaultCredentials)
  const [saveStatus, setSaveStatus] = useState<string>("")

  // Load saved credentials on component mount
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedCredentials = await getCredentials()
        setCredentials(savedCredentials)
      } catch (error) {
        console.error("Error loading credentials:", error)
      }
    }
    
    loadCredentials()
  }, [])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    
    setCredentials(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await saveCredentials(credentials)
      setSaveStatus("Credentials saved successfully!")
      
      setTimeout(() => {
        setSaveStatus("")
      }, 3000)
    } catch (error) {
      console.error("Error saving credentials:", error)
      setSaveStatus("Error saving credentials. Please try again.")
      
      setTimeout(() => {
        setSaveStatus("")
      }, 3000)
    }
  }

  return (
    <div className="popup-container">
      <h1>Workday Autofill</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Default Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={credentials.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Default Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="autoFillEnabled"
            name="autoFillEnabled"
            checked={credentials.autoFillEnabled}
            onChange={handleChange}
          />
          <label htmlFor="autoFillEnabled">
            Enable automatic form filling
          </label>
        </div>
        
        <button type="submit" className="save-button">
          Save Credentials
        </button>
        
        {saveStatus && <div className="status-message">{saveStatus}</div>}
      </form>
      
      <div className="info-text">
        <p>
          This extension will automatically fill in Workday signup forms with 
          your saved credentials.
        </p>
        <p>
          Look for the blue "Fill Workday Form" button on the bottom-right of Workday signup pages.
        </p>
        <div className="iconLink" style={{
          fontSize: "1.2rem",
          textAlign: "center",
          display: "flex",
          justifyContent: "start",
        }}>
          <a style={{
            textDecoration: "none",
            color: "inherit",
          }} href="https://github.com/rkhatta1" target="__blank"><FaGithub /></a>  
          <a style={{ marginLeft: "1rem", textDecoration: "none",
          color: "inherit", }} href="https://www.linkedin.com/in/raajveer-khattar/" target="__blank"><FaLinkedin /></a>
          <a style={{ marginLeft: "1rem", textDecoration: "none",
          color: "inherit", }} href="https://rkhatta1.github.io/rkhatta1/" target="__blank"><MdEmail /></a>
          </div>
      </div>
    </div>
  )
}

export default IndexPopup