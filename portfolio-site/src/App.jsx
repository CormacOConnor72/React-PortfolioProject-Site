import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import DataManager from './components/DataManager';
import Wheel from './components/Wheel';
import Contact from './components/Contact';
import Info from './components/Info';
import './App.css';

// Main portfolio page component
const MainPage = () => (
  <main>
    <section id="home">
      <Hero />
    </section>
    <section id="about">
      <About />
    </section>
    <section id="projects">
      <Projects />
    </section>
    <section id="data">
      <DataManager />
    </section>
    <section id="wheel">
      <Wheel />
    </section>
    <section id="contact">
      <Contact />
    </section>
  </main>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <>
              <Header />
              <MainPage />
            </>
          } />
          <Route path="/info" element={<Info />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;