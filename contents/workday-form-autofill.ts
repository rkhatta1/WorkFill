import { getCredentials } from "../storage"

// Log script initialization
// console.log("Workday Autofill: Script initialized")

// Global variable for the floating button
let floatingButton: HTMLButtonElement | null = null

// Initialize the script
initializeScript()

// Main initialization function
async function initializeScript() {
  try {
    // Check if we're on a Workday page
    if (isWorkdayPage()) {
      // console.log("Workday Autofill: Detected Workday page")
      
      // Create floating button
      createFloatingButton()
      
      // Try to fill the form after the page has fully loaded
      if (document.readyState === 'complete') {
        setTimeout(attemptFormFill, 500)
      } else {
        window.addEventListener('load', () => {
          setTimeout(attemptFormFill, 500)
        })
      }
    }
  } catch (error) {
    console.error("Workday Autofill initialization error:", error)
  }
}

// Check if we're on a Workday page
function isWorkdayPage(): boolean {
  const workdayDomains = ['workday.com', 'myworkday.com', 'myworkdayjobs.com']
  return workdayDomains.some(domain => window.location.hostname.includes(domain))
}

// Create a floating button
function createFloatingButton() {
  if (floatingButton || document.getElementById('workday-autofill-button')) {
    return // Don't create duplicate buttons
  }
  
  try {
    floatingButton = document.createElement('button')
    floatingButton.id = 'workday-autofill-button'
    floatingButton.innerText = '📝 Fill Workday Form'
    
    // Style the button
    Object.assign(floatingButton.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '9999',
      padding: '8px 12px',
      backgroundColor: '#4285f4',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      cursor: 'pointer',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px'
    })
    
    // Add click handler
    floatingButton.onclick = function() {
      attemptFormFill()
      return false
    }
    
    // Add to page
    document.body.appendChild(floatingButton)
    // console.log("Workday Autofill: Button created")
  } catch (error) {
    console.error("Error creating button:", error)
  }
}

// Attempt to fill the form with credentials
async function attemptFormFill() {
  try {
    // console.log("Workday Autofill: Attempting to get credentials")
    const credentials = await getCredentials()
    // console.log("Workday Autofill: Got credentials", credentials)
    
    // Check if credentials exist and are valid
    if (!credentials || !credentials.email || !credentials.password) {
      // Only show error message if user clicked the button (not on automatic fill)
      const isManualTrigger = (document.activeElement?.id === 'workday-autofill-button');
      if (isManualTrigger) {
        showMessage("Please set your credentials in the extension popup", "error")
      }
      // console.log("Workday Autofill: No valid credentials found", credentials)
      return
    }
    
    // console.log("Workday Autofill: Attempting to fill form with", 
    //             { email: credentials.email, passwordLength: credentials.password.length })
    
    // Find and fill email field
    const emailInput = findInputField(['email'])
    let emailFilled = false
    if (emailInput) {
      fillField(emailInput, credentials.email)
      emailFilled = true
    }
    
    // Find and fill password fields
    const passwordFields = findPasswordFields()
    let passwordsFilled = false
    if (passwordFields.length >= 1) {
      // First password field is the password
      fillField(passwordFields[0], credentials.password)
      
      // If there's a second password field, it's likely the confirmation
      if (passwordFields.length >= 2) {
        fillField(passwordFields[1], credentials.password)
      }
      
      passwordsFilled = true
    }
    
    // Only show message if something was actually filled AND
    // either it's a manual trigger OR autoFillEnabled is true
    if ((emailFilled || passwordsFilled) && 
        ((document.activeElement?.id === 'workday-autofill-button') || credentials.autoFillEnabled)) {
      showMessage("Form filled with your credentials", "success")
    } else if (!emailFilled && !passwordsFilled && document.activeElement?.id === 'workday-autofill-button') {
      // Only show warning if the button was clicked and nothing was filled
      showMessage("Could not find form fields - try clicking inside fields first", "warning")
    }
  } catch (error) {
    console.error("Workday Autofill error:", error)
    const isManualTrigger = (document.activeElement?.id === 'workday-autofill-button');
    if (isManualTrigger) {
      showMessage(`Error: ${error.message}`, "error")
    }
  }
}

// Find an input field based on keywords
function findInputField(keywords: string[]): HTMLInputElement | null {
  try {
    // Try data-automation-id attribute first (common in Workday)
    for (const keyword of keywords) {
      const automationSelector = `input[data-automation-id*="${keyword}"]`
      const input = document.querySelector(automationSelector) as HTMLInputElement
      if (input) {
        // console.log(`Found field with automation ID matching '${keyword}'`)
        return input
      }
    }
    
    // Try conventional attributes
    const selectors = [
      ...keywords.map(k => `input[type="${k}"]`),
      ...keywords.map(k => `input[name*="${k}" i]`),
      ...keywords.map(k => `input[id*="${k}" i]`),
      ...keywords.map(k => `input[placeholder*="${k}" i]`),
      ...keywords.map(k => `input[aria-label*="${k}" i]`)
    ]
    
    for (const selector of selectors) {
      const input = document.querySelector(selector) as HTMLInputElement
      if (input) {
        // console.log(`Found field with selector: ${selector}`)
        return input
      }
    }
    
    // Try finding through labels
    const labels = document.querySelectorAll('label')
    for (const label of labels) {
      if (keywords.some(k => label.textContent?.toLowerCase().includes(k.toLowerCase()))) {
        // Check for 'for' attribute
        const forId = label.getAttribute('for')
        if (forId) {
          const input = document.getElementById(forId) as HTMLInputElement
          if (input?.tagName === 'INPUT') {
            // console.log(`Found field through label with 'for' attribute: ${forId}`)
            return input
          }
        }
        
        // Check for adjacent input
        let sibling = label.nextElementSibling
        while (sibling) {
          if (sibling.tagName === 'INPUT') {
            // console.log(`Found field adjacent to label: ${label.textContent}`)
            return sibling as HTMLInputElement
          }
          // Check one level down
          const nestedInput = sibling.querySelector('input')
          if (nestedInput) {
            // console.log(`Found nested field near label: ${label.textContent}`)
            return nestedInput as HTMLInputElement
          }
          
          sibling = sibling.nextElementSibling
        }
      }
    }
  } catch (error) {
    console.error(`Error finding input field for ${keywords}:`, error)
  }
  
  // console.log(`Could not find input field for keywords: ${keywords.join(', ')}`)
  return null
}

// Find password fields on the page
function findPasswordFields(): HTMLInputElement[] {
  const fields: HTMLInputElement[] = []
  
  try {
    // Try data-automation-id first
    const automationFields = document.querySelectorAll('input[data-automation-id*="password"]')
    automationFields.forEach(field => {
      if (field instanceof HTMLInputElement) {
        // console.log(`Found password field with automation-id: ${field.getAttribute('data-automation-id')}`)
        fields.push(field)
      }
    })
    
    // Find password fields by specific automation IDs for verification fields
    const verifyPasswordField = document.querySelector('input[data-automation-id="verifyPassword"]') as HTMLInputElement || 
                               document.querySelector('input[data-automation-id="confirmPassword"]') as HTMLInputElement
    
    if (verifyPasswordField && !fields.includes(verifyPasswordField)) {
      // console.log('Found verify password field with specific automation-id')
      fields.push(verifyPasswordField)
    }
    
    // If we find at least one field but not both, look for the other fields
    if (fields.length === 1) {
      // Try the standard password type 
      const passwordFields = document.querySelectorAll('input[type="password"]')
      passwordFields.forEach(field => {
        if (field instanceof HTMLInputElement && !fields.includes(field)) {
          // console.log('Found additional password field with type="password"')
          fields.push(field)
        }
      })
    }
    
    // If no fields found by automation ID, try standard password type
    if (fields.length === 0) {
      const passwordFields = document.querySelectorAll('input[type="password"]')
      passwordFields.forEach(field => {
        if (field instanceof HTMLInputElement) {
          // console.log('Found password field with type="password"')
          fields.push(field)
        }
      })
    }
    
    // If still no fields found, try any input with 'password' in name/id
    if (fields.length === 0) {
      const otherFields = document.querySelectorAll(
        'input[name*="password" i], input[id*="password" i], input[placeholder*="password" i]'
      )
      otherFields.forEach(field => {
        if (field instanceof HTMLInputElement && !fields.includes(field)) {
          // console.log('Found password field through name/id/placeholder')
          fields.push(field)
        }
      })
    }
    
    // Try to find fields by label text
    if (fields.length < 2) {
      const verifyLabels = ['verify new password', 'confirm password', 'verify password', 're-enter password']
      const passwordLabels = ['password', 'create password']
      
      // Find all labels
      const labels = document.querySelectorAll('label')
      
      // Look for verification password field
      for (const label of labels) {
        const labelText = label.textContent?.toLowerCase() || ''
        if (verifyLabels.some(text => labelText.includes(text))) {
          // Try to find the associated input
          const forId = label.getAttribute('for')
          if (forId) {
            const input = document.getElementById(forId) as HTMLInputElement
            if (input?.tagName === 'INPUT' && !fields.includes(input)) {
              // console.log(`Found verify password field through label: ${labelText}`)
              fields.push(input)
              break
            }
          }
          
          // Try next sibling or child
          const input = label.nextElementSibling?.querySelector('input') || 
                       label.nextElementSibling as HTMLInputElement || 
                       label.querySelector('input')
          
          if (input instanceof HTMLInputElement && !fields.includes(input)) {
            // console.log(`Found verify password field near label: ${labelText}`)
            fields.push(input)
            break
          }
        }
      }
      
      // If we still don't have enough fields, look for regular password field
      if (fields.length < 2) {
        for (const label of labels) {
          const labelText = label.textContent?.toLowerCase() || ''
          if (passwordLabels.some(text => labelText.includes(text))) {
            // Try to find the associated input
            const forId = label.getAttribute('for')
            if (forId) {
              const input = document.getElementById(forId) as HTMLInputElement
              if (input?.tagName === 'INPUT' && !fields.includes(input)) {
                // console.log(`Found password field through label: ${labelText}`)
                fields.push(input)
                break
              }
            }
            
            // Try next sibling or child
            const input = label.nextElementSibling?.querySelector('input') || 
                         label.nextElementSibling as HTMLInputElement || 
                         label.querySelector('input')
            
            if (input instanceof HTMLInputElement && !fields.includes(input)) {
              // console.log(`Found password field near label: ${labelText}`)
              fields.push(input)
              break
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error finding password fields:", error)
  }
  
  // console.log(`Found ${fields.length} password fields`)
  return fields
}

// Fill a form field with a value
function fillField(field: HTMLInputElement, value: string) {
  try {
    field.value = value
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new Event('change', { bubbles: true }))
    
    // Try to focus and blur to trigger validation
    field.focus()
    setTimeout(() => field.blur(), 100)
    
    // console.log(`Field filled: ${field.name || field.id || 'unnamed'}`)
  } catch (error) {
    console.error("Error filling field:", error)
  }
}

// Show a message on the page
function showMessage(message: string, type: 'success' | 'warning' | 'error') {
  try {
    // Remove any existing message
    const existingMsg = document.getElementById('workday-autofill-message')
    if (existingMsg) {
      existingMsg.remove()
    }
    
    // Create new message element
    const msgElement = document.createElement('div')
    msgElement.id = 'workday-autofill-message'
    msgElement.innerText = message
    
    // Set styles based on message type
    const colors = {
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    }
    
    Object.assign(msgElement.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: '9999',
      padding: '10px 15px',
      backgroundColor: colors[type],
      color: 'white',
      borderRadius: '4px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      transition: 'opacity 0.5s'
    })
    
    // Add to page
    document.body.appendChild(msgElement)
    
    // Remove after delay
    setTimeout(() => {
      msgElement.style.opacity = '0'
      setTimeout(() => msgElement.remove(), 500)
    }, 3000)
  } catch (error) {
    console.error("Error showing message:", error)
  }
}