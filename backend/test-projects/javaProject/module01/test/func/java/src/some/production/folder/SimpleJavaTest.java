package some.production.folder;

import java.sql.PreparedStatement;
import java.util.List;
import annotation.ScrumTeam;

/**
 * Tests various insert scenarios for the some production java class
 *
 * @ScrumTeam Team_01_Sub
 * @author developer.name
 * @since version.01
 */
@ScrumTeam("Team_01")
@TestLabels(SomeLabel.ClassLabel01)
public class SimpleJavaTest extends JavaBaseTest {

    /**
     * Tests some initial method 01 in the prod class
     */
    @TestLabels(IgnoreFailureReason.IN_DEV)
    public void testFirstMethod_01() throws Exception{
        // Do some testing 01
    }

    /**
     * Tests some initial method 02 in the prod class
     */
    @ScrumTeam("Team_02")
    @TestLabels({ IgnoreFailureReason.Label1, IgnoreFailureReason.Label2 })
    public void testSecondMethod_02() throws Exception {
        // Do some other testing 02
    }

}
