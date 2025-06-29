# 🏰 Clash of Clans Clan Manager (ClanOS)

A comprehensive, feature-rich web application designed to revolutionize Clash of Clans clan management. Built with modern technologies and integrated with the official Clash of Clans API for real-time data synchronization.

## 🌟 About The Project

ClanOS is a full-stack web application that provides a complete ecosystem for Clash of Clans clan management. From multi-account profile switching to real-time war coordination, this platform offers everything clan leaders and members need to build and maintain a thriving community.

### 🛠️ Built With

*   **[Next.js 14](https://nextjs.org/)** - React Framework with App Router
*   **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
*   **[Supabase](https://supabase.io/)** - PostgreSQL Database & Authentication
*   **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS Framework
*   **[Shadcn/ui](https://ui.shadcn.com/)** - Modern component library
*   **[TLDraw](https://tldraw.dev/)** - Interactive canvas for war planning
*   **[Liveblocks](https://liveblocks.io/)** - Real-time collaboration
*   **[Clash of Clans API](https://developer.clashofclans.com/)** - Official game data integration

---

## 🚀 Key Features

### 👤 **Multi-Profile System**
*   **Multiple Account Support**: Link and manage multiple Clash of Clans accounts under one user profile
*   **Seamless Profile Switching**: Quick switching between accounts with visual feedback
*   **Account Claiming/Transfer**: Transfer accounts between users with verification options
*   **Automatic Role Detection**: Roles sync automatically from Clash of Clans (Leader, Co-Leader, Elder, Member)
*   **Profile Management**: Comprehensive profile management interface in settings

### 🏛️ **Advanced Admin Dashboard**
*   **Role-Based Access Control**: Hierarchical permissions (Admin → Leader → Co-Leader → Elder → Member)
*   **Clan Relationship Management**: Manage allied clans, friendly clans, and enemy clans
*   **Invitation System**: Send and manage clan invitations with approval workflows
*   **Bulk Role Synchronization**: Admin tools to sync all user roles from Clash of Clans API
*   **User Management**: View and manage all platform users with their linked accounts

### ⚔️ **War Room & Planning**
*   **Real-Time War Status**: Live current war information with attack tracking
*   **Interactive War Planning**: TLDraw-powered canvas for strategy planning
*   **Collaborative Tools**: Real-time collaboration on war strategies
*   **Attack Coordination**: Track who's attacking which base
*   **War Analytics**: Historical war performance tracking

### 📱 **Social Features**
*   **Multi-Feed System**: 
     - **My Clan Feed**: Posts from your active clan
     - **Global Feed**: Posts from all clans on the platform
     - **Group Feed**: Posts from allied/friendly clans
*   **Image Sharing**: Upload and share images in posts with loading feedback
*   **Comment System**: Engage with posts through comments
*   **Like System**: React to posts and build community engagement
*   **Friend System**: Connect with other players across clans

### 📊 **Analytics & Statistics**
*   **Live Clan Data**: Real-time synchronization with Clash of Clans API
*   **Member Analytics**: Detailed member statistics and progression tracking
*   **Donation Tracking**: Monitor clan donation statistics
*   **Performance Metrics**: Comprehensive clan and individual performance data
*   **Historical Data**: Track progress over time

### 🎯 **Community Management**
*   **Feature Request System**:
     - Submit and vote on new feature ideas
     - Category-based organization
     - Community-driven development
     - Admin response and status tracking
*   **Feedback Board**: Centralized feedback collection and management
*   **User Roles**: Comprehensive role system matching Clash of Clans hierarchy

### 🔐 **Security & Authentication**
*   **Supabase Authentication**: Secure user registration and login
*   **Row Level Security (RLS)**: Database-level security policies
*   **API Token Management**: Secure integration with Clash of Clans API
*   **Account Verification**: Verify account ownership through API tokens

---

## 🏗️ Technical Architecture

### **Frontend**
- **Next.js 14** with App Router for optimal performance
- **TypeScript** for type safety and better developer experience
- **Tailwind CSS** for responsive, utility-first styling
- **Shadcn/ui** components for consistent design system
- **Real-time updates** with Supabase subscriptions

### **Backend**
- **Supabase** for database, authentication, and real-time features
- **PostgreSQL** with advanced RLS policies
- **API Routes** for server-side logic and external API integration
- **Automatic role synchronization** with Clash of Clans API

### **Database Schema**
- **Multi-profile support** with linked_profiles table
- **Comprehensive user management** with role hierarchy
- **Social features** with posts, comments, and likes
- **Clan relationship management** for multi-clan coordination
- **Feature request system** with voting and commenting

---

## 🚀 Getting Started

### Prerequisites

*   **Node.js** (v18 or later)
*   **npm** or **yarn**
*   **Supabase account** for database and authentication
*   **Clash of Clans API key** from [developer.clashofclans.com](https://developer.clashofclans.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/IkonicR/ClanOS.git
    cd clash-of-clans-clan-manager
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment setup:**
    Create `.env.local` in the project root:
    ```env
    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    
    # Clash of Clans API
    CLASH_OF_CLANS_API_TOKEN=your_coc_api_token
    
    # Liveblocks (for real-time collaboration)
    LIVEBLOCKS_SECRET_KEY=your_liveblocks_key
    ```

4.  **Database setup:**
    Run the migration files in `/supabase/migrations/` in your Supabase SQL Editor in order.

5.  **Start development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📱 Usage Guide

### **For Clan Members**
1. **Sign up** and link your Clash of Clans account
2. **Join your clan's community** on the platform
3. **Switch between multiple accounts** if you have them
4. **Participate in war planning** using the interactive canvas
5. **Engage with clan posts** and build community

### **For Clan Leaders**
1. **Manage clan relationships** with other clans
2. **Send clan invitations** through the platform
3. **Monitor member activity** and statistics
4. **Coordinate war strategies** with real-time planning tools
5. **Access admin dashboard** for comprehensive clan management

### **For Platform Admins**
1. **Manage all clans** on the platform
2. **Sync user roles** in bulk from Clash of Clans API
3. **Monitor platform activity** and user engagement
4. **Handle feature requests** and community feedback

---

## 🔄 Auto-Sync Features

The platform automatically synchronizes data to ensure accuracy:

- **Role Synchronization**: User roles update automatically from Clash of Clans
- **Clan Data**: Member lists and clan information sync in real-time
- **Profile Updates**: Account information stays current with game data
- **War Status**: Current war information updates automatically

---

## 🎨 UI/UX Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark/Light Theme**: User preference-based theming
- **Loading States**: Comprehensive loading feedback throughout the app
- **Error Handling**: Graceful error handling with user-friendly messages
- **Accessibility**: Built with accessibility best practices

---

## 🛡️ Security Features

- **Row Level Security**: Database-level access control
- **API Rate Limiting**: Protection against API abuse
- **Input Validation**: Comprehensive input sanitization
- **CORS Protection**: Secure cross-origin resource sharing
- **Authentication Guards**: Protected routes and API endpoints

---

## 📈 Performance Optimizations

- **Server-Side Rendering**: Fast initial page loads
- **Image Optimization**: Automatic image compression and resizing
- **API Caching**: Intelligent caching of external API calls
- **Database Indexing**: Optimized database queries
- **Code Splitting**: Efficient bundle loading

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

---

## 📝 License

This project is licensed under the MIT License. See `LICENSE` file for details.

---

## 🙏 Acknowledgments

- **Supercell** for the amazing Clash of Clans game and API
- **Supabase** for the incredible backend-as-a-service platform
- **Vercel** for seamless deployment and hosting
- **The open-source community** for the amazing tools and libraries

---

## 📞 Support & Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/IkonicR/ClanOS/issues)
- **Documentation**: Comprehensive guides available in the `/docs` folder
- **Community**: Join our Discord for support and discussions

---

## 🗓️ Version History

### v2.0.0 - Multi-Profile System (Current)
- ✅ Multi-account support with seamless switching
- ✅ Advanced admin dashboard with role management
- ✅ Automatic role synchronization from Clash of Clans API
- ✅ Account claiming and transfer functionality
- ✅ Enhanced social features with multi-feed system
- ✅ Real-time war planning with collaborative canvas
- ✅ Comprehensive clan relationship management

### v1.0.0 - Initial Release
- ✅ Basic clan management features
- ✅ User authentication and profiles
- ✅ Clash of Clans API integration
- ✅ Social feed and community features
- ✅ Feature request system

---

**Built with ❤️ for the Clash of Clans community**
