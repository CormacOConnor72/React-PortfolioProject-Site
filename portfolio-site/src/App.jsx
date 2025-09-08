import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Info from './components/Info';
import Data from './components/Data';
import TemplatePage from './components/TemplatePage';
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
          <Route path="/data" element={<Data />} />
          <Route path="/template" element={<TemplatePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;