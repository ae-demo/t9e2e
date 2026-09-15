// The signed-in app shell — every screen the wireframes draw carries the same
// `navbar "Task Board"`; the DSL draws no sidebar, so this shell carries none
// either (react-webapp / oxygen-ui-design-system: build what is drawn).
import { AppShell, Divider, Footer, Header, UserMenu } from "@wso2/oxygen-ui";
import { Outlet } from "react-router";
import { useAuth } from "../AuthGate";
import { signOut } from "../auth";

export default function AppLayout() {
  const { name, email } = useAuth();

  return (
    <AppShell>
      <AppShell.Navbar>
        <Header>
          <Header.Brand>
            <Header.BrandTitle>Task Board</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={name} />
              <UserMenu.Header name={name} email={email} />
              <UserMenu.Logout onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer>
        <Footer>
          <Footer.Copyright>© Task Board</Footer.Copyright>
        </Footer>
      </AppShell.Footer>
    </AppShell>
  );
}
