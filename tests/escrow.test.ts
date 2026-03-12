import * as anchor from &quot;@coral-xyz/anchor&quot;;
import { Program } from &quot;@coral-xyz/anchor&quot;;
import { Escrow } from &quot;../target/types/escrow&quot;;

describe(&quot;escrow&quot;, () =&gt; {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Escrow as Program&lt;Escrow&gt;;

  it(&quot;Is initialized!&quot;, async () =&gt; {
    const tx = await program.methods
      .initialize()
      .rpc();
    console.log(&quot;Transaction signature&quot;, tx);
  });
});