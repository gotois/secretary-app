import { format } from 'quasar'
import pkg from '../../../package.json'

const productName = 'Secretary'
const { humanStorageSize } = format

export default {
  productName,
  organization: {
    prodid: `-//GIC DAO//NONSGML ${productName.toUpperCase()} ${
      pkg.version
    }//EN`,
  },
  opensearch: {
    title: 'Search in the archive of contracts',
  },
  pages: {
    welcome: {
      title: 'Secretary — tasks, meetings and events in one calendar',
    },
    create: {
      title: 'Create a contract',
    },
    sign: {
      title: 'Sign a contract',
    },
    auth: {
      title: 'Authorization',
      caption: 'Enter key',
    },
    privacy: {
      title: 'Privacy policy',
    },
    tutorial: {
      welcome: { title: `Welcome to "${productName}"` },
      info: { title: 'How we works' },
      agreement: { title: 'Terms of use' },
      oidc: { title: 'OIDC' },
      final: { title: 'Agreement for use' },
    },
    calendar: {
      title: 'Calendar of contracts',
      newEvent: 'New event',
      busy: 'Busy',
      empty: 'No events',
      loadError: 'Unable to load calendar',
      retry: 'Retry',
      removeSuccess: 'Event "{name}" successfully deleted.',
    },
    unknown: {
      seo: {
        title: 'Page not found',
      },
      title: '404',
      description: 'Oops. Empty...',
      submit: 'Go back to the main page',
    },
  },
  login: {
    oidcIssuer: 'Your OIDC Issuer: {oidcIssuer}',
    authentication: 'Authenticate',
  },
  list: {
    explore: 'Clear Search',
  },
  archive: {
    search: 'Search',
    tooltip: 'Start typing',
    empty: 'Add your first commitment.',
    searchEmpty: 'Nothing found. Try changing your search options.',
    filterEmpty: 'Nothing is selected.',
    notfound: 'No results',
  },
  navigation: {
    about: 'About',
    score: 'NPS',
    version: 'v.{version}',
    title: 'Settings',
    register: 'Registration',
    signout: 'Exit from Solid',
    signin: 'Login with Solid',
    support: {
      free: {
        label: 'Leave a review',
        tooltip: 'If you find an error, please write to us about it.',
      },
      premium: {
        label: 'Support',
        tooltip: 'Please write to us.',
      },
      vip: {
        label: 'Support',
        tooltip: 'Please call to us.',
      },
    },
    back: 'Back',
    noscript: 'Please enable JavaScript to run the application.',
  },
  settings: {
    native: {
      profile: 'My profile',
      title: 'Database',
      calendars: 'Calendars',
      pod: 'Personal Spaces',
      description: 'Loading and unloading your contracts.',
      import: 'Select contract database file',
      submit: 'Import contracts',
      export: 'Export contracts',
      otp: 'Password login',
    },
    consumer: {
      description: 'Change your full name or email in new contracts.',
    },
    otp: {
      removeCode: 'Remove PIN',
      addCode: 'Set PIN',
      description: 'Enter a numeric OTP from 2FA to log into the application.',
    },
    keychain: {
      title: 'Manage Certificates',
      label: 'Export Certificate',
      tooltip: 'Export certificate to a file',
    },
    clean: {
      description: 'This action will permanently delete your contracts.',
      label: 'Confirm the deletion of your contract database.',
      ok: 'Delete',
      okAll: 'Delete + Pod',
      cancel: 'Cancel',
      submit: 'Perform Cleanup',
    },
    language: {
      title: 'Language',
    },
  },
  oidc: {
    issuerHint: 'Select URL address',
    tutorialHint: 'OIDC Issuer is the URL of your SOLID provider',
    login: 'Log in',
    skip: 'Skip',
    issuerTooltipEmpty: 'Data is required to sign contracts.',
    issuerTooltipLogin: 'Log in through {oidcIssuer}.',
  },
  contract: {
    rules: 'Enter contract type',
    type: 'Contract type',
    hint: {
      desktop: 'Select contract type. Press "Tab" or "⏎" to create a new one',
      mobile: 'Press "Enter" on the keyboard to create a new one',
    },
    option: 'Create new type',
    editDialog: {
      message: 'Enter new description:',
      success: 'Data updated',
      fail: 'Update failed',
    },
    removeDialog: {
      ok: 'Delete',
      cancel: 'Cancel',
      message: 'Are you sure you want to delete? This action cannot be undone.',
      isLoginMessage:
        'Are you sure you want to delete? This action cannot be undone.\nNote: Data will not be deleted from your Pod.',
      success: 'Contract "{name}" successfully deleted.',
      fail: 'There was a problem deleting the data.',
    },
  },
  consumer: {
    type: 'Full name',
    email: 'Email',
    emailRules: 'Enter email address',
    rules: 'Enter consumer (client) of the service',
    save: 'Save',
    success: 'Profile updated',
  },
  wallet: {
    disconnected: 'Wallet disconnected',
    accountChanged: 'Account changed',
    fail: 'Error binding crypto wallet',
  },
  customer: {
    rules: 'Enter performer WebId',
    type: 'Performer',
    hintType: 'Set Entity or Individual',
    hint: 'WebId',
    contact: 'Contact',
    hintContact: 'Use Email, URL or Tel',
  },
  description: {
    type: 'Note',
    hint: 'Use Plain Text or Markdown for note',
  },
  duration: {
    noLimit: 'No expiration',
    from: 'Contract start date',
    fromHint: 'Application submission date',
    to: 'Contract end date',
    toHint: 'Application end date',
    close: 'Close',
    infinity: 'Unlimited',
  },
  files: {
    type: 'Attach document',
    hint: 'Use PDF, PNG, or JPG format.',
  },
  contractForm: {
    submit: 'Submit',
    date: 'Open calendar',
  },
  tutorial: {
    welcome: {
      title: `Welcome to ${productName}`,
      body: 'Convenient and secure recording of any agreements on your devices.',
      hint: 'You can find these documents in the application settings at any time.',
      ok: 'Accept and Continue',
      demoHint: 'Start without authorization you will be Demo sign. Continue?',
    },
    info: {
      title: 'How our service works',
      body:
        'Our service works as follows: we record the terms of agreements in a reliable storage accessible only to you, either on your physical device or on your SOLID server.' +
        "<br><br>To ensure the security and confidentiality of your information, our application uses the browser's internal storage, which is only accessible from your current device. Your data never leaves your device without your explicit permission." +
        '<br><br>Therefore, when you use our service, you can be confident in the safety and control of your data.' +
        '<br><br>Documents signed in the service have legal force. In case of conflict, they will be accepted by the tax office and the court.' +
        '<br><br>Documents are stored in the electronic archive of your phone. You can find and print them at any time.',
    },
    agreement: {
      title: 'User Agreement',
      caption: 'Accept the user agreement',
      body:
        'We want to assure you that our service does not collect any of your personal information. We value your privacy and pay great attention to protecting your data.' +
        '<br><br>Our application is distributed "as is", without any warranties or obligations. We make every effort to ensure its functionality and security, but we are not responsible for any errors or issues that may arise from its use.' +
        '<br><br>The [source code of the application](https://github.com/gotois/secretary-app) is distributed under the license:' +
        '<br>[GNU General Public License v3.0](https://github.com/gotois/secretary-app/blob/master/LICENSE). [Open source libraries](https://app.fossa.com/projects/git%2Bgithub.com%2Fgotois%2Fsecretary-web).' +
        '<br><br>The full user agreement is available at: [User Agreement](https://archive.gotointeractive.com/privacy). We recommend that you carefully read it to fully understand the terms of use of our service.',
    },
    wallet: {
      title: 'Connecting Crypto Wallet',
      caption: 'Use your cryptographic key',
      body: 'The application uses the [Solana](https://solana.com) blockchain. To confirm your transactions, use the [Phantom](https://phantom.app) wallet or enter your secret key.',
    },
    safety: {
      title: 'Safety Guide',
      caption: 'Read carefully',
      body: 'Be sure to read the text of the contract that you sign. And only if you are sure, agree to it.',
    },
    oidc: {
      title: 'Connecting Solid server',
      caption: 'Provide your unique identifier',
      body:
        'You can store your contracts in the cloud; our service uses [SOLiD](https://solidproject.org). To authenticate, log in using your [OIDC Issuer](# "OpenID Connect Issuer") address.' +
        "<br><br>If you have any questions or need assistance, please refer to the technical documentation of the standard or contact our [support team](mailto:support{'@'}gotointeractive.com). We are ready to answer all your questions regarding the use of our service.",
      ok: 'Next',
    },
    data: {
      title: '{name}, confirm your account data',
      body: 'To use the application, use your name and email address. Add your cryptographic key DID',
      submit: 'Accept',
    },
  },
  pricing: {
    free: {
      title: 'Free',
      description: 'Service: Contract storage',
      price: 'per user/month',
      support: {
        title: 'Support',
        values: {
          '1': 'Text feedback',
          '2': 'Stories video',
        },
      },
      functions: {
        title: 'Base functions',
        values: {
          '1': 'Save and search contracts offline',
          '2': 'Save to external SOLiD server',
        },
      },
    },
    premium: {
      title: 'Premium',
      description: 'Project: Full liability management',
      price: 'per user/month',
      support: {
        title: 'Premium Support',
        values: {
          '1': 'Everything included in Free, plus...',
          '2': 'E-mail feedback',
        },
      },
      functions: {
        title: 'Extended functions',
        values: {
          '1': 'Everything included in Free, plus...',
          '2': 'GenAI: text, pdf',
          '3': 'Verification',
        },
      },
    },
    vip: {
      title: 'VIP',
      description: 'Solution: “Pocket Lawyer”',
      price: 'per user/month',
      support: {
        title: 'Luxury Support',
        values: {
          '1': 'Everything included in Premium, plus...',
          '2': 'Voice help 24/7',
          '3': 'Privileged training events',
        },
      },
      functions: {
        title: 'Individual functions',
        values: {
          '1': 'Everything included in Premium, plus...',
          '2': 'Telemetry off',
        },
      },
    },
  },
  archiveList: {
    remove: 'Delete',
    edit: 'Edit',
    pod: 'Pod',
    openFile: 'Open document window',
    closeFile: 'Close document window',
    shareFile: 'Share document',
  },
  database: {
    fileSize: 'Select a file up to ' + humanStorageSize(1024 * 1024 * 1024 * 2),
    fileImport: 'Start database import procedure',
    fileExport: 'Export database to file',
    removeDatabase: 'Perform database deletion',
    pod: {
      disconnected: 'You have disconnected from your Pod',
      sync: 'Sync with Pod',
    },
  },
  searchDialog: {
    searchText: 'Contract type or performer',
    cancel: 'Close',
  },
  calendar: {
    days: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday_Sunday',
    daysShort: 'Su_Mo_Tu_We_Th_Fr_Sa',
    months:
      'January_February_March_April_May_June_July_August_September_October_November_December',
    monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec',
  },
  components: {
    phantomWallet: {
      label: 'Private Key Solana',
      hint: 'Enter the address of your Private Key from Solana or log in through a wallet',
      info: 'This is your Solana Phantom Private key',
      open: 'Solana Wallet Dialog',
      skip: 'Skip',
      ok: 'Next',
    },
    otp: {
      processing: 'Please wait...',
      fail: 'Invalid key',
      pinDialog: {
        message: 'Are you sure you want to remove the PIN?',
        success: 'Key disabled',
        fail: 'Error occurred',
      },
      saveDialog: {
        message: 'Are you sure you want to save the PIN?',
        success: 'PIN saved',
        fail: 'Error in saving PIN',
      },
    },
    oidcIssuer: {
      label: 'URL Address',
      input: 'Enter your OIDC Issuer address:',
      fail: 'OIDC Issuer cannot be empty',
      processing: 'Authenticating. Please wait...',
      authorizeDialog: {
        message:
          'Your contracts will not be saved on the SOLiD server. Use offline-mode. Continue?',
        fail: 'Error occurred while logging in with OIDC',
      },
    },
    keypair: {
      generate: {
        label: 'Generate new key',
        tooltip: 'Generating a new key',
      },
      import: {
        label: 'Import Key File',
        tooltip: 'Import an existing key',
        fail: 'Error occurred while reading the file',
      },
      export: {
        dialog: {
          message: 'Do you want to save the DID key locally?',
          success: "Keys are generated and stored in your device's memory.",
          fail: 'Your key could not be saved locally on the device.',
        },
      },
    },
    database: {
      fileImportDialog: {
        title: 'Import Contracts',
        message: 'Click OK to start the import procedure',
        fail: 'Import failed',
      },
      fileRejected: 'The selected file is too large',
      fileExportDialog: {
        title: 'Export Contracts',
        prompt: 'Enter the filename for the contracts:',
        message: 'Preparing...',
        progress: 'Creating... {percentage}%',
        success: 'File saved',
        fail: 'Error exporting file',
      },
    },
    databaseRemove: {
      success: 'Database removed. Please wait for the page to reload.',
      fail: 'An error occurred.',
    },
    archiveList: {
      sheet: {
        title: 'Select an action',
        link: {
          label: 'Share SOLID Link',
          success: 'Link copied to clipboard',
          fail: 'Copy failed',
        },
        share: {
          label: 'Save document',
          fail: 'Error sharing file',
        },
        event: {
          native: {
            label: 'Save to Calendar',
            fail: 'Error downloading ICS file',
          },
          google: {
            label: 'Add event to Google Calendar',
          },
        },
        mail: {
          label: 'Send message',
        },
        telephone: {
          label: 'Call',
        },
        law: {
          label: 'Challenge in court',
        },
        map: {
          label: 'Open in Map',
        },
      },
    },
    contractForm: {
      resetDialog: {
        message: 'Are you sure you want to clear the form?',
      },
      selectDate: {
        fail: 'Start date cannot be later than today',
      },
      wrongDate: {
        fail: 'Unknown date type',
      },
      submitDate: {
        success: 'Record {id} added',
        fail: 'Record failed',
        redirect: 'Go',
      },
    },
    imageContextMenu: {
      open: 'Open file',
      copy: 'Copy to clipboard',
      success: 'Data copied to clipboard',
      share: 'Share file',
      fail: 'Error occurred',
    },
  },
  webPush: {
    requestMessage: 'Enable notifications to stay updated on your contracts.',
    enableButton: 'Enable',
  },
  copy: {
    success: 'Copied successfull',
  },
}
