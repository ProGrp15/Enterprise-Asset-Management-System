import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaBell, FaBuilding, FaChartBar, FaClipboardList, FaCog, FaFileAlt, FaMapMarkerAlt, FaTools, FaTruck, FaUsers, FaBoxes, FaSignOutAlt, FaRobot, FaBars, FaSearch, FaChevronDown, FaMoon, FaSun } from 'react-icons/fa';
import { logout } from '../../store/authSlice';
import { notifications } from '../../services/notificationService';
import { useThemeContext } from '../../context/ThemeContext';

const icons={Dashboard:FaChartBar,Employees:FaUsers,Departments:FaUsers,'Asset Categories':FaBoxes,Assets:FaBoxes,Locations:FaMapMarkerAlt,Vendors:FaTruck,'Purchase Orders':FaFileAlt,Maintenance:FaTools,'Asset Requests':FaClipboardList,'Asset Allocation':FaBoxes,'Asset Transfers':FaBoxes,'Asset Returns':FaBoxes,'Repair History':FaTools,Notifications:FaBell,Reports:FaChartBar,'Audit Logs':FaClipboardList,Settings:FaCog,Profile:FaUsers,Companies:FaBuilding,'My Assets':FaBoxes,'Request Asset':FaClipboardList,'AI Assistant':FaRobot};

export default function AppShell({role,children}) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState('');
  const user=useSelector(s=>s.auth.user); const dispatch=useDispatch(); const navigate=useNavigate();
  const { theme, toggleTheme } = useThemeContext();
  const prefix=role==='super'?'/super-admin':role==='employee'?'/employee':'/company-admin';
  const links=role==='super'?['Dashboard','Companies','Notifications','Audit Logs','Settings','Profile']:role==='employee'?['Dashboard','My Assets','Request Asset','Notifications','Profile','AI Assistant']:['Dashboard','Employees','Departments','Asset Categories','Assets','Locations','Vendors','Purchase Orders','Maintenance','Asset Requests','Asset Allocation','Asset Transfers','Asset Returns','Repair History','Notifications','Reports','Audit Logs','Settings','Profile','AI Assistant'];
  const path=l=>`${prefix}/${l.toLowerCase().replaceAll(' ','-')}`; const name=user?.name||user?.fullName||'Workspace member'; const initials=name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const signOut=()=>{dispatch(logout());navigate('/login')};
  useEffect(()=>{let active=true;notifications.list().then(items=>{if(active)setUnreadCount((Array.isArray(items)?items:[]).filter(item=>!item.is_read).length)}).catch(()=>{if(active)setUnreadCount(0)});return()=>{active=false}},[]);
  return <div className="app-layout">
    {open&&<button className="sidebar-scrim d-lg-none" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}<aside className={`app-sidebar ${open?'is-open':''}`}>
      <div className="sidebar-top"><NavLink to={prefix+'/dashboard'} className="sidebar-brand" onClick={()=>setOpen(false)}><span className="brand-mark"><FaBuilding/></span><span><span className="brand-name">assetflow</span><small>operations OS</small></span></NavLink><span className="workspace-chip">{role==='super'?'PLATFORM':role==='employee'?'MEMBER':'WORKSPACE'}</span></div>
      <div className="sidebar-label">{role==='super'?'Platform control':role==='employee'?'My workspace':'Operations'}</div><nav className="sidebar-nav">{links.map(l=>{const I=icons[l];return <NavLink end={l==='Dashboard'} key={l} to={path(l)} onClick={()=>setOpen(false)} className="app-nav-link"><I/><span>{l}</span>{l==='Notifications'&&unreadCount>0&&<span className="nav-count">{unreadCount}</span>}</NavLink>})}</nav>
      <div className="sidebar-footer"><div className="sidebar-help"><strong>Need a hand?</strong><span>Visit the help center</span></div><button className="sidebar-logout" onClick={signOut}><FaSignOutAlt/> Sign out</button></div>
    </aside>
    <main className="app-main"><header className="app-topbar"><div className="topbar-left"><button className="mobile-menu d-lg-none" onClick={()=>setOpen(true)} aria-label="Open navigation"><FaBars/></button><form className="topbar-search" onSubmit={e=>{e.preventDefault();if(search.trim())navigate(`${prefix}/${role==='employee'?'my-assets':'assets'}?search=${encodeURIComponent(search.trim())}`)}}><FaSearch/><input aria-label="Search workspace" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search workspace..."/></form></div><div className="topbar-actions"><span className="service-status"><i/> Workspace connected</span><button className="icon-button" aria-label="Toggle theme" onClick={toggleTheme}>{theme==='dark'?<FaSun/>:<FaMoon/>}</button><NavLink to={path('Notifications')} className="icon-button" aria-label="Notifications"><FaBell/>{unreadCount>0&&<b>{unreadCount}</b>}</NavLink><div className="user-menu"><div className="avatar">{initials}</div><div className="user-meta"><strong>{name}</strong><span>{user?.role?.replaceAll('_',' ')||'Member'}</span></div><FaChevronDown className="user-chevron"/></div><button aria-label="Log out" className="logout-button" onClick={signOut}><FaSignOutAlt/></button></div></header><div className="app-content">{children}</div></main>
  </div>
}
