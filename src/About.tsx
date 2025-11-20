// Props include a function to handle the click event to switch back to the main config view
const About = ({ onBackClick }: { onBackClick: () => void }) => {
  return (
    <div className="about-page">
      <div className="about-content">
        <button onClick={onBackClick} className="back-button">← Back to Config</button>

        <h1>About Friend Watch Configurator</h1>
        <p>
          This is a GUI for configuring LittleBit's SwitchFriendWatch utility.
        </p>

        <ul>
          <li><a href="https://github.com/littlebitstudios/SwitchFriendWatch">Get SwitchFriendWatch on GitHub</a></li>
          <li><a href="https://littlebitstudios.com">Main LittleBit Website</a></li>
          <li><a href="https://littlebit670.link">Find LittleBit Everywhere on Gravatar</a></li>
        </ul>

        <h2>Credits and License</h2>
        <p>This website's icon was made using an icon from <a href="https://fontawesome.com">Font Awesome</a>.</p>

        <p>This website, the SwitchFriendWatch project, and the nxapi project that SwitchFriendWatch uses, are utilities for users of Nintendo's Switch and Switch 2 family of video game systems. LittleBit, LittleBit Studios, nor anyone else involved with the SwitchFriendWatch and nxapi projects, are affiliated with Nintendo Co. Ltd or its international subsidiaries.</p>

        <p>The Nintendo Switch and Switch 2, their logos, and other Nintendo marks and logos, are properties of Nintendo Co. Ltd and international subsidiaries. This website nor the SwitchFriendWatch project use any official Nintendo materials or intellectual properties in their production.</p>

        <p>The source code of this website, the SwitchFriendWatch project, and nxapi are licensed under the GNU AGPL 3.0. See the source of nxapi on <a href="https://gitlab.fancy.org.uk/samuel/nxapi">gitlab.fancy.org.uk/samuel/nxapi</a> or <a href="https://github.com/samuelthomas2774/nxapi">github.com/samuelthomas2774/nxapi</a>.</p>

        <p>Font Awesome's free icons are licensed under CC BY 4.0. See the licensing details on <a href="https://fontawesome.com/license/free">Font Awesome's website</a> or <a href="https://creativecommons.org/licenses/by/4.0/">the Creative Commons website</a>.</p>
      </div>
    </div>
  );
};

export default About;